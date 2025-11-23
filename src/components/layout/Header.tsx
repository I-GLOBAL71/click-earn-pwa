import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Settings, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { getAuth, isSignInWithEmailLink } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";

export const Header = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { user, isAdmin, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [askEmailForLink, setAskEmailForLink] = useState(false);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleNavClick = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const onOpenAuth = (e: any) => {
      setAskEmailForLink(false);
      setAuthOpen(true);
      const intent = e?.detail?.intent;
      if (intent) {
        setLastIntent(String(intent));
        window.gtag?.('event', 'auth_modal_open', { intent });
      }
    };
    window.addEventListener('open-auth-modal', onOpenAuth as any);
    return () => window.removeEventListener('open-auth-modal', onOpenAuth as any);
  }, []);

  useEffect(() => {
    const auth = getAuth();
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setAskEmailForLink(true);
      setAuthOpen(true);
    }
  }, [location.pathname]);

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
  };

  return (
    <>
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <Button variant="ghost" onClick={() => { setAskEmailForLink(false); setAuthOpen(true); setLastIntent('login'); window.gtag?.('event','auth_modal_open',{ intent: 'login' }); }}>Connexion</Button>
              <Button variant="hero" size="lg" onClick={() => { setAskEmailForLink(false); setAuthOpen(true); setLastIntent('signup'); window.gtag?.('event','auth_modal_open',{ intent: 'signup' }); }}>Commencer</Button>
            </>
          ) : (
            <>
              {isAdmin && (
                <Button variant="ghost" asChild>
                  <Link to="/admin/dashboard">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Tableau de bord</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/products">Produits</Link>
              </Button>
              <Button variant="outline" onClick={signOut}>
                Déconnexion
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="flex flex-col gap-4 mt-8">
              {!user ? (
                <>
                  <Button variant="ghost" className="justify-start" onClick={() => { setAskEmailForLink(false); setAuthOpen(true); setLastIntent('login'); handleNavClick(); window.gtag?.('event','auth_modal_open',{ intent: 'login' }); }}>Connexion</Button>
                  <Button variant="hero" onClick={() => { setAskEmailForLink(false); setAuthOpen(true); setLastIntent('signup'); handleNavClick(); window.gtag?.('event','auth_modal_open',{ intent: 'signup' }); }}>Commencer</Button>
                </>
              ) : (
                <>
                  {isAdmin && (
                    <Button variant="ghost" asChild className="justify-start">
                      <Link to="/admin/dashboard" onClick={handleNavClick}>
                        <Settings className="h-4 w-4 mr-2" />
                        Admin
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" asChild className="justify-start">
                    <Link to="/dashboard" onClick={handleNavClick}>Tableau de bord</Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link to="/products" onClick={handleNavClick}>Produits</Link>
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    Déconnexion
                  </Button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
    <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} askEmailForLink={askEmailForLink} onSignedIn={() => { setAuthOpen(false); try { queryClient.invalidateQueries({ queryKey: ['is-ambassador'] }); queryClient.invalidateQueries({ queryKey: ['my-orders'] }); queryClient.invalidateQueries({ queryKey: ['products'] }); } catch {} if (lastIntent === 'signup') { window.gtag?.('event','sign_up', { method: 'modal' }); } else { window.gtag?.('event','login', { method: 'modal' }); } }} />
    </>
  );
};
