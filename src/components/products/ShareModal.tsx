import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, MessageCircle, Facebook, Mail, QrCode, Check } from "lucide-react";
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Partager "{productName}"</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Commission: {commission} par vente
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* URL Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ton lien de recommandation</label>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={referralUrl} 
                className="flex-1 text-sm"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="icon"
                className="shrink-0"
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
            <label className="text-sm font-medium">Message de partage</label>
            <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-line">
              {shareMessage}
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Partager via</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={shareViaWhatsApp}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                WhatsApp
              </Button>
              
              <Button
                onClick={shareViaFacebook}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              
              <Button
                onClick={shareViaMessenger}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <MessageCircle className="h-4 w-4 text-blue-500" />
                Messenger
              </Button>
              
              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={copyToClipboard}
              className="w-full gradient-primary"
              size="lg"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Lien copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le lien
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};