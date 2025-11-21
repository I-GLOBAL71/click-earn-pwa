import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Mail, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAuth, GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  askEmailForLink?: boolean;
  onSignedIn?: () => void;
}

export const AuthModal = ({ isOpen, onClose, askEmailForLink = false, onSignedIn }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [validating, setValidating] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setSending(false);
      setValidating(false);
      setGoogleLoading(false);
    }
  }, [isOpen]);

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Connexion Google réussie");
      onSignedIn && onSignedIn();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Erreur Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const actionCodeSettings = {
    url: `${import.meta.env.VITE_APP_PUBLIC_URL || window.location.origin}/auth`,
    handleCodeInApp: true,
  };

  const handleSendMagic = async () => {
    try {
      setSending(true);
      const auth = getAuth();
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      toast.success("Lien magique envoyé. Vérifie ton email.");
    } catch (e: any) {
      toast.error(e?.message || "Erreur d’envoi du lien magique");
    } finally {
      setSending(false);
    }
  };

  const handleValidateMagic = async () => {
    try {
      setValidating(true);
      const auth = getAuth();
      const href = window.location.href;
      if (!isSignInWithEmailLink(auth, href)) {
        toast.error("Lien invalide");
        return;
      }
      await signInWithEmailLink(auth, email || window.localStorage.getItem("emailForSignIn") || "", href);
      window.localStorage.removeItem("emailForSignIn");
      toast.success("Connexion par lien magique réussie");
      onSignedIn && onSignedIn();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Erreur de validation du lien magique");
    } finally {
      setValidating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md p-6 rounded-2xl border border-border shadow-elegant bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur animate-scale-in">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Connexion</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Choisissez votre méthode d’authentification</DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6">
          <Button onClick={handleGoogle} className="w-full h-11 gradient-primary font-semibold shadow-lg hover:opacity-90 transition-all" disabled={googleLoading}>
            {googleLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <GoogleIcon className="h-5 w-5 mr-2" />
            )}
            {googleLoading ? "Connexion…" : "Continuer avec Google"}
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">ou</span>
            <Separator className="flex-1" />
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3 bg-background/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium">Email sans mot de passe</span>
            </div>
            <div className="flex gap-2">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="flex-1 h-11" autoFocus={askEmailForLink} />
              {!askEmailForLink ? (
                <Button onClick={handleSendMagic} disabled={sending || !email} className="h-11 gradient-secondary">
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {sending ? "Envoi…" : "Envoyer le lien"}
                </Button>
              ) : (
                <Button onClick={handleValidateMagic} disabled={validating || !email} className="h-11 gradient-secondary">
                  {validating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {validating ? "Validation…" : "Valider le lien"}
                </Button>
              )}
            </div>
            {!askEmailForLink && (
              <p className="text-xs text-muted-foreground">Nous vous enverrons un lien de connexion magique.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="ghost" className="w-full sm:w-auto">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const GoogleIcon = (props: any) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <g>
      <path fill="#EA4335" d="M12 11.999h10.19c.091.532.137 1.09.137 1.668 0 5.715-3.824 9.783-10.327 9.783-5.972 0-10.8-4.828-10.8-10.8S6.028 1.85 12 1.85c3.219 0 5.915 1.183 7.88 3.11l-3.29 3.29c-1.098-1.053-2.506-1.7-4.59-1.7-3.922 0-6.952 3.02-6.952 6.942s3.03 6.953 6.952 6.953c3.99 0 5.476-2.86 5.704-4.343H12V12z"/>
      <path fill="#4285F4" d="M23.81 13.667c.091.532.137 1.09.137 1.668 0 5.715-3.824 9.783-10.327 9.783-5.972 0-10.8-4.828-10.8-10.8 0-.94.126-1.853.363-2.722L6.7 13.52c-.19.58-.294 1.198-.294 1.878 0 3.922 3.03 6.953 6.952 6.953 3.99 0 5.476-2.86 5.704-4.343h4.748z" opacity=".3"/>
      <path fill="#FBBC05" d="M6.7 13.52l-3.654-2.594C4.006 7.681 7.65 4.766 12 4.766c2.067 0 3.93.72 5.39 1.927l3.29-3.29C18.635 1.211 15.905.35 12 .35 6.028.35 1.2 5.178 1.2 11.15c0 1.83.474 3.555 1.307 5.058L6.7 13.52z" opacity=".6"/>
      <path fill="#34A853" d="M12 23.25c4.143 0 7.62-2.31 9.167-5.53l-4.748-.001c-.228 1.483-1.714 4.343-5.704 4.343-2.898 0-5.373-1.739-6.373-4.198L1.2 16.208C2.916 19.93 7.092 23.25 12 23.25z" opacity=".6"/>
    </g>
  </svg>
);