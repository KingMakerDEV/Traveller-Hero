import { Mountain } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="container mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Mountain className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">
                Traveller<span className="text-primary">Hero</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              AI-powered adventure travel, crafted for the curious and the bold.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-widest text-primary">Explore</h4>
              <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <Link to="/planner" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Planner</Link>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-widest text-primary">Company</h4>
              <span className="block text-sm text-muted-foreground">About</span>
              <span className="block text-sm text-muted-foreground">Contact</span>
            </div>
          </div>

          {/* Newsletter placeholder */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Stay Updated</h4>
            <p className="text-sm text-muted-foreground">
              Follow us for travel inspiration and exclusive offers.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TravellerHero. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
