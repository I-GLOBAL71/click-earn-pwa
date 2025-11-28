import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, MessageCircle, Facebook, Mail, Check, Share2, Send, Twitter, Linkedin, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  referralUrl: string;
  commission: string;
}

export const ShareModal = ({ isOpen, onClose, productName, referralUrl, commission }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);

  const shareMessage = `🎁 Découvre ${productName}!\n\n✨ Profite de cette offre exceptionnelle.\n🔗 Clique ici: ${referralUrl}\n\n💰 Tu peux aussi gagner des commissions en partageant ce produit!`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Lien copié dans le presse-papier!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Découvre ${productName}`;
    const body = shareMessage;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  const shareViaMessenger = () => {
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(referralUrl)}&app_id=YOUR_FB_APP_ID&redirect_uri=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const shareViaTwitter = () => {
    const text = `Découvre ${productName}! 🔥\n\n${referralUrl}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareViaLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
    window.open(url, '_blank');
  };

  const shareViaTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(`Découvre ${productName}!`)}`;
    window.open(url, '_blank');
  };

  const shareViaSMS = () => {
    const url = `sms:?body=${encodeURIComponent(shareMessage)}`;
    window.location.href = url;
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Découvre ${productName}`,
          text: shareMessage,
          url: referralUrl,
        });
        toast.success("Partagé avec succès!");
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error("Erreur lors du partage");
        }
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 max-h-[85vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold leading-tight">Partager & Gagner</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Partage <span className="font-semibold text-primary">"{productName}"</span> et touche <span className="font-semibold text-secondary">{commission}</span> par commande.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {navigator.share && (
            <Button
              onClick={shareNative}
              className="w-full h-11 gradient-primary font-semibold shadow-lg text-sm"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Partager via...
            </Button>
          )}

          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Ton lien personnel</span>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={referralUrl} 
                className="flex-1 text-xs sm:text-sm bg-muted border-border h-10 truncate"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="icon"
                className="shrink-0 h-10 w-10 border-border"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="share-options">
              <AccordionTrigger className="text-sm font-medium text-muted-foreground">Autres options de partage</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                  <SocialButton onClick={shareViaWhatsApp} icon={MessageSquare} label="WhatsApp" color="text-green-500" />
                  <SocialButton onClick={shareViaFacebook} icon={Facebook} label="Facebook" color="text-blue-600" />
                  <SocialButton onClick={shareViaMessenger} icon={MessageCircle} label="Messenger" color="text-purple-500" />
                  <SocialButton onClick={shareViaTelegram} icon={Send} label="Telegram" color="text-sky-500" />
                  <SocialButton onClick={shareViaTwitter} icon={Twitter} label="X (Twitter)" />
                  <SocialButton onClick={shareViaLinkedIn} icon={Linkedin} label="LinkedIn" color="text-blue-700" />
                  <SocialButton onClick={shareViaSMS} icon={MessageCircle} label="SMS" color="text-orange-500" />
                  <SocialButton onClick={shareViaEmail} icon={Mail} label="Email" color="text-red-500" />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="preview">
              <AccordionTrigger className="text-sm font-medium text-muted-foreground">Aperçu du message</AccordionTrigger>
              <AccordionContent>
                <div className="p-3 bg-muted/50 rounded-lg text-xs whitespace-pre-line break-all sm:break-words leading-snug border border-dashed border-muted-foreground/30 mt-2 max-h-40 overflow-y-auto">
                  {shareMessage}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button onClick={onClose} variant="ghost" className="w-full sm:w-auto">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Composant bouton pour les réseaux sociaux
const SocialButton = ({ onClick, icon: Icon, label, color = 'text-foreground' }) => (
  <Button
    onClick={onClick}
    variant="outline"
    className="w-full justify-start gap-3 px-3 py-2 h-10 border-border hover:bg-muted/50"
  >
    <Icon className={`h-5 w-5 ${color}`} />
    <span className="font-medium text-sm">{label}</span>
  </Button>
);
