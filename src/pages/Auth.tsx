import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { AuthModal } from "@/components/auth/AuthModal";
import { getAuth, isSignInWithEmailLink } from "firebase/auth";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [open, setOpen] = useState(true);
  const [askEmailForLink, setAskEmailForLink] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => {
    const auth = getAuth();
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const stored = window.localStorage.getItem("emailForSignIn");
      if (!stored) {
        setAskEmailForLink(true);
        setOpen(true);
      } else {
        setAskEmailForLink(true);
        setOpen(true);
        toast.info("Veuillez valider le lien magique avec votre email");
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <AuthModal
          isOpen={open}
          onClose={() => setOpen(false)}
          askEmailForLink={askEmailForLink}
          onSignedIn={() => navigate("/dashboard")}
        />
      </main>
    </div>
  );
};

export default Auth;
