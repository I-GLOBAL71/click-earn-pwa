import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, MessageCircle, Facebook, Mail, Check, Share2, Send } from "lucide-react";
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
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(referralUrl)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(referralUrl)}`;
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Partager "{productName}"</DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            <Badge className="gradient-secondary border-0 text-base font-bold px-3 py-1">
              💰 {commission}
            </Badge>
            <span className="text-sm text-muted-foreground">par vente</span>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Native Share Button */}
          {navigator.share && (
            <Button
              onClick={shareNative}
              className="w-full gradient-primary font-semibold shadow-lg"
              size="lg"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Partager maintenant
            </Button>
          )}

          {/* URL Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Ton lien de recommandation</label>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={referralUrl} 
                className="flex-1 text-sm bg-muted border-2"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="icon"
                className="shrink-0 border-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share Message Preview */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Aperçu du message</label>
            <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-line border-2 border-muted">
              {shareMessage}
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Partager via</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={shareViaWhatsApp}
                variant="outline"
                className="w-full justify-start gap-2 h-12 border-2 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <MessageCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">WhatsApp</span>
              </Button>
              
              <Button
                onClick={shareViaFacebook}
                variant="outline"
                className="w-full justify-start gap-2 h-12 border-2 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <Facebook className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Facebook</span>
              </Button>
              
              <Button
                onClick={shareViaMessenger}
                variant="outline"
                className="w-full justify-start gap-2 h-12 border-2 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Messenger</span>
              </Button>
              
              <Button
                onClick={shareViaTelegram}
                variant="outline"
                className="w-full justify-start gap-2 h-12 border-2 hover:bg-sky-50 dark:hover:bg-sky-950"
              >
                <Send className="h-5 w-5 text-sky-500" />
                <span className="font-medium">Telegram</span>
              </Button>

              <Button
                onClick={shareViaTwitter}
                variant="outline"
                className="w-full justify-start gap-2 h-12 border-2 hover:bg-slate-50 dark:hover:bg-slate-950"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="font-medium">X (Twitter)</span>
              </Button>

              <Button
                onClick={shareViaLinkedIn}
                variant="outline"
                className="w-full justify-start gap-2 h-12 border-2 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <svg className="h-5 w-5 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="font-medium">LinkedIn</span>
              </Button>

              <Button
                onClick={shareViaSMS}
                variant="outline"
                className="w-full justify-start gap-2 h-12 border-2 hover:bg-purple-50 dark:hover:bg-purple-950"
              >
                <MessageCircle className="h-5 w-5 text-purple-600" />
                <span className="font-medium">SMS</span>
              </Button>
              
              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="w-full justify-start gap-2 h-12 border-2 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Mail className="h-5 w-5 text-red-600" />
                <span className="font-medium">Email</span>
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="w-full border-2"
              size="lg"
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5 mr-2 text-green-500" />
                  <span className="font-semibold">Lien copié !</span>
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Copier le lien</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};