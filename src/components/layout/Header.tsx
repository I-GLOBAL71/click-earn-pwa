import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export const Header = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-smooth hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-elegant">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            RewardLink
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {isHomePage ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Connexion</Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth?mode=signup">Commencer</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Tableau de bord</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/products">Produits</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
