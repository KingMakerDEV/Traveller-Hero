import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Menu, X, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Planner", to: "/planner" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/about#feedback" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

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
          <Mountain className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Traveller<span className="text-primary">Hero</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.to
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <motion.div
            animate={{ width: searchOpen ? 200 : 36 }}
            className="relative overflow-hidden"
          >
            {searchOpen && (
              <input
                autoFocus
                placeholder="Search destinations…"
                className="w-full bg-transparent border-b border-muted-foreground/30 py-1 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                onBlur={() => setSearchOpen(false)}
              />
            )}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="absolute right-0 top-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </motion.div>

          <Button size="sm" className="hidden md:inline-flex" asChild>
            <Link to="/planner">Book Now</Link>
          </Button>

          {/* Mobile menu */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground"
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
