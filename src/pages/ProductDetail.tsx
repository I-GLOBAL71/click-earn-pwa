import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ShoppingCart, Check, Star, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";
import useEmblaCarousel from "embla-carousel-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const resp = await fetch(`${apiBase}/api/products?id=${encodeURIComponent(String(id))}`);
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || "Produit introuvable");
      return json;
    },
    enabled: Boolean(id)
  });

  const { data: isAmbassadorRes } = useQuery({
    queryKey: ["is-ambassador"],
    queryFn: async () => {
      const auth = getAuth();
      const current = auth.currentUser;
      if (!current) return { isAmbassador: false };
      const token = await current.getIdToken();
      const resp = await fetch(`${apiBase}/api/is-ambassador`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await resp.json().catch(() => ({ isAmbassador: false }));
      return json;
    }
  });

  const [emblaRef] = useEmblaCarousel({ loop: true });

  const images: string[] = useMemo(() => {
    const arr = Array.isArray(product?.images) && product.images.length ? product.images : (product?.image_url ? [product.image_url] : []);
    return arr.map((u: string) => u.replace(/([?&])w=\d+[^&]*/g, "").replace(/([?&])h=\d+[^&]*/g, ""));
  }, [product]);

  const formatPrice = (price: number) => `${Number(price || 0).toLocaleString('fr-FR')} FCFA`;

  const commissionType = String(product?.commission_type || "percentage");
  const commissionValue = Number(product?.commission_value || 0);
  const unitPrice = Number(product?.price || 0);
  const ambassador = Boolean(isAmbassadorRes?.isAmbassador);
  const discountPerUnit = ambassador ? (commissionType === "percentage" ? unitPrice * (commissionValue / 100) : Math.min(unitPrice, Math.max(0, commissionValue))) : 0;
  const discountedUnit = Math.max(0.01, unitPrice - discountPerUnit);
  const totalDue = discountedUnit * quantity;
  const savings = discountPerUnit * quantity;
  

  const features = useMemo(() => {
    const desc = String(product?.description || "");
    const parts = desc.split(/[.;\n]+/).map(p => p.trim()).filter(p => p.length >= 6).slice(0, 8);
    return parts;
  }, [product]);

  const changeQty = (delta: number) => {
    const stock = Number(product?.stock_quantity || 0);
    const next = Math.max(1, quantity + delta);
    const capped = stock > 0 ? Math.min(stock, next) : next;
    setQuantity(capped);
  };

  const handleOrder = async () => {
    try {
      const auth = getAuth();
      const current = auth.currentUser;
      if (!current) {
        window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { intent: 'order' } }));
        return;
      }
      if (!ambassador) throw new Error("Réservé aux ambassadeurs");
      const token = await current.getIdToken();
      const resp = await fetch(`${apiBase}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: id, quantity })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || "Commande impossible");
      toast.success("Commande confirmée", { description: `Total: ${formatPrice(json.total_amount)} • Économie: ${formatPrice(json.discount_amount)}` });
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8"><p>Chargement…</p></main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8"><p>Produit non trouvé</p></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Button variant="ghost" onClick={() => navigate("/products")} className="mb-6">
          <ArrowLeft className="h-4 w-4" />
          Retour aux produits
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4 animate-fade-in">
            <div className="overflow-hidden rounded-2xl">
              <div className="embla" ref={emblaRef}>
                <div className="embla__container flex">
                  {images.map((src, idx) => (
                    <div key={idx} className="embla__slide min-w-0 flex-[0_0_100%] relative aspect-square bg-muted">
                      <img src={src} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {images.map((src, idx) => (
                <div key={idx} className="h-16 w-16 rounded-md overflow-hidden border">
                  <img src={src} alt={`Thumb ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{product.category}</Badge>
              {product.stock_quantity && product.stock_quantity < 10 && (
                <Badge className="bg-red-500 border-0">Stock limité</Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Qualité vérifiée</Badge>
            </div>
          </div>

          <div className="space-y-6 animate-slide-up">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              {product.description && <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>}
            </div>

            <Card className="shadow-card">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Caractéristiques</h3>
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-secondary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {features.length === 0 && (
                    <li className="text-sm text-muted-foreground">Aucune caractéristique détaillée</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-elegant gradient-hero border-0">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground line-through">{formatPrice(unitPrice)}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold text-primary">{formatPrice(discountedUnit)}</p>
                      {ambassador && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge aria-label="Réduction appliquée" className="bg-secondary text-secondary-foreground border-0">
                              Réduction appliquée
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            Remise {commissionType === 'percentage' ? `${commissionValue}%` : `${formatPrice(commissionValue)}`} appliquée grâce à votre statut ambassadeur
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-sm font-medium text-secondary">
                      {ambassador ? (
                        <>Prix ambassadeur ({commissionType === 'percentage' ? `-${commissionValue}%` : `-${formatPrice(commissionValue)}`})</>
                      ) : (
                        <>Connectez-vous en tant qu'ambassadeur pour la remise</>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Économie</p>
                    <p className="text-2xl font-bold text-secondary">{formatPrice(savings)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-xs text-muted-foreground">Quantité</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => changeQty(-1)}>-</Button>
                      <Input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || '1')))} className="w-20 text-center" />
                      <Button type="button" variant="outline" size="sm" onClick={() => changeQty(1)}>+</Button>
                    </div>
                    {product.stock_quantity > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">Stock: {product.stock_quantity}</p>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-xs text-muted-foreground">Total après réduction</p>
                    <p className="text-xl font-semibold">{formatPrice(totalDue)}</p>
                    <p className="text-xs text-secondary">Économie: {formatPrice(savings)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button onClick={handleOrder} variant="hero" size="lg" className="w-full" disabled={!ambassador}>
                    <ShoppingCart className="h-5 w-5" />
                    Commander
                  </Button>
                  {!ambassador && (
                    <p className="text-xs text-muted-foreground text-center">Seuls les ambassadeurs peuvent commander à prix réduit</p>
                  )}
                  
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
