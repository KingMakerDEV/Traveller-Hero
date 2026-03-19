import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Menu, X, Mountain, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Planner", to: "/planner" },
  { label: "About", to: "/about" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { user, isLoggedIn, signInWithGoogle, signOut } = useAuthStore();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Mountain className="h-6 w-6 text-[#e6c419]" />
          <span className="text-lg font-bold tracking-tight text-white">
            Traveller<span className="text-[#e6c419]">Hero</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-[#e6c419] ${
                location.pathname === link.to
                  ? "text-[#e6c419]"
                  : "text-stone-400"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <motion.div
            animate={{ width: searchOpen ? 200 : 36 }}
            className="relative overflow-hidden hidden sm:block"
          >
            {searchOpen && (
              <input
                autoFocus
                placeholder="Search destinations…"
                className="w-full bg-transparent border-b border-white/20 py-1 pr-8 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-[#e6c419]"
                onBlur={() => setSearchOpen(false)}
              />
            )}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="absolute right-0 top-0 p-1 text-stone-400 hover:text-white transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </motion.div>

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-9 h-9 rounded-full bg-[#142A27] border border-white/10 overflow-hidden group-hover:border-[#e6c419] transition-colors">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#e6c419] bg-[#0A1F1C]">
                        <User size={18} />
                      </div>
                    )}
                  </div>
                  <ChevronDown size={14} className="text-stone-500 group-hover:text-white transition-colors" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0A1F1C] border-white/10 text-white shadow-2xl">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-xs text-stone-500 font-mono tracking-widest uppercase mb-0.5">Logged in as</p>
                  <p className="font-semibold text-sm truncate">{user?.name}</p>
                </div>
                <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-[#e6c419] cursor-pointer">
                  <Link to="/profile" className="flex items-center gap-2 py-2.5">
                    <User size={16} />
                    My Trips
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem 
                  onClick={() => signOut()}
                  className="focus:bg-red-500/10 focus:text-red-500 cursor-pointer text-red-500"
                >
                  <div className="flex items-center gap-2 py-2.5">
                    <LogOut size={16} />
                    Sign Out
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              size="sm" 
              onClick={() => signInWithGoogle()}
              className="bg-[#e6c419] text-[#0A1F1C] hover:bg-[#d4b517] font-bold"
            >
              Sign In
            </Button>
          )}

          {/* Mobile menu */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden glass-strong border-t border-border"
        >
          <div className="container mx-auto px-6 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-primary py-2"
              >
                {link.label}
              </Link>
            ))}
            <Button size="sm" asChild>
              <Link to="/planner" onClick={() => setIsOpen(false)}>
                Book Now
              </Link>
            </Button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
