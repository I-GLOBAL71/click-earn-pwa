import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ShieldCheck, Zap } from "lucide-react";
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
      <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Connexion</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Choisissez votre méthode d’authentification</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={handleGoogle} className="w-full h-11 gradient-primary font-semibold" disabled={googleLoading}>
            <Zap className="h-5 w-5 mr-2" />
            {googleLoading ? "Connexion…" : "Continuer avec Google"}
          </Button>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium">Email sans mot de passe</span>
            </div>
            <div className="flex gap-2">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="flex-1 h-10" />
              {!askEmailForLink ? (
                <Button onClick={handleSendMagic} disabled={sending || !email} className="h-10">
                  <Mail className="h-4 w-4 mr-2" />
                  {sending ? "Envoi…" : "Envoyer le lien"}
                </Button>
              ) : (
                <Button onClick={handleValidateMagic} disabled={validating || !email} className="h-10">
                  <Mail className="h-4 w-4 mr-2" />
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