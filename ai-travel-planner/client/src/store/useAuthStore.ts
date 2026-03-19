import { create } from "zustand";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  initAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

// Track whether the auth listener has already been registered
// so initAuth can be called multiple times safely
let authListenerRegistered = false;

const verifyWithBackend = async (
  token: string,
  sessionUser: any
): Promise<UserProfile | null> => {
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      const data = await response.json();

      // Backend returns full_name — map it to name for the store
      if (data.user) {
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.full_name || data.user.name || sessionUser.email?.split("@")[0] || "Traveller",
          avatar: data.user.avatar_url || data.user.avatar || "",
        };
      }
    }
  } catch (error) {
    console.error("Backend verify error:", error);
  }

  // Fallback — build profile from session directly if backend fails
  return {
    id: sessionUser.id,
    email: sessionUser.email || "",
    name:
      sessionUser.user_metadata?.full_name ||
      sessionUser.user_metadata?.name ||
      sessionUser.email?.split("@")[0] ||
      "Traveller",
    avatar:
      sessionUser.user_metadata?.avatar_url ||
      sessionUser.user_metadata?.picture ||
      "",
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  isLoading: true,

  setUser: (user) => set({ user, isLoggedIn: !!user }),
  setToken: (token) => set({ token }),

  initAuth: async () => {
    set({ isLoading: true });

    // Register auth state change listener only once
    // Must be registered BEFORE getSession so OAuth redirects are caught
    if (!authListenerRegistered) {
      authListenerRegistered = true;

      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("AUTH EVENT:", event);

        if (event === "SIGNED_IN" && session) {
          const token = session.access_token;
          const userProfile = await verifyWithBackend(token, session.user);

          set({
            user: userProfile,
            token,
            isLoggedIn: true,
            isLoading: false,
          });
        } else if (event === "SIGNED_OUT") {
          set({
            user: null,
            token: null,
            isLoggedIn: false,
            isLoading: false,
          });
        } else if (event === "TOKEN_REFRESHED" && session) {
          // Update token silently when Supabase refreshes it
          set({ token: session.access_token });
        }
      });
    }

    // Check for existing session on page load
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const token = session.access_token;
        const userProfile = await verifyWithBackend(token, session.user);

        set({
          user: userProfile,
          token,
          isLoggedIn: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          token: null,
          isLoggedIn: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Auth init error:", error);
      set({
        user: null,
        token: null,
        isLoggedIn: false,
        isLoading: false,
      });
    }
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // window.location.origin dynamically resolves to the current domain
        // In production this becomes https://traveller-hero.vercel.app
        // In development this becomes http://localhost:8080
        redirectTo: window.location.origin,
      },
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, token: null, isLoggedIn: false });
  },
}));