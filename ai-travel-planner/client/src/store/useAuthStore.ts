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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  isLoading: true,

  setUser: (user) => set({ user, isLoggedIn: !!user }),
  setToken: (token) => set({ token }),

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const token = session.access_token;
        
        // Verify with backend - payload must be { token } in body
        const response = await fetch(`${API_URL}/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          const userData = await response.json();
          set({ 
            user: userData.user || { 
              id: session.user.id, 
              email: session.user.email,
              name: session.user.user_metadata.full_name || session.user.email?.split("@")[0]
            }, 
            token, 
            isLoggedIn: true 
          });
        } else {
          await supabase.auth.signOut();
          set({ user: null, token: null, isLoggedIn: false });
        }
      } else {
        set({ user: null, token: null, isLoggedIn: false });
      }
    } catch (error) {
      console.error("Auth init error:", error);
      set({ user: null, token: null, isLoggedIn: false });
    } finally {
      set({ isLoading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const token = session.access_token;
        const response = await fetch(`${API_URL}/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (response.ok) {
          const userData = await response.json();
          set({ 
            user: userData.user || { 
              id: session.user.id, 
              email: session.user.email,
              name: session.user.user_metadata.full_name
            }, 
            token, 
            isLoggedIn: true 
          });
        }
      } else if (event === "SIGNED_OUT") {
        set({ user: null, token: null, isLoggedIn: false });
      }
    });
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, token: null, isLoggedIn: false });
  },
}));
