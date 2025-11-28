import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Eye, Loader2, MousePointer } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ShareModal } from "@/components/products/ShareModal";

const Products = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  type Product = {
    id: string;
    name: string;
    description?: string;
    category?: string;
    price: number;
    commission_type: 'percentage' | 'fixed' | string;
    commission_value: number;
    image_url?: string;
    stock_quantity?: number;
    click_commission?: number;
  };
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [referralUrl, setReferralUrl] = useState("");

  // Charger les produits depuis la base de données
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
      const resp = await fetch(`${apiBase}/api/products`);
      const json = await resp.json().catch(() => null);
      if (!resp.ok) return [];
      return json || [];
    }
  });

  const { data: commissionSettings } = useQuery<any>({
    queryKey: ["commission-settings-public"],
    queryFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? '' : '');
      const res = await fetch(`${apiBase}/api/commission-settings`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: Boolean(user),
  });

  // Mutation pour générer le lien de recommandation
  const generateLinkMutation = useMutation({
    mutationFn: async (productId: string) => {
      const auth = getAuth();
      const current = auth.currentUser;
      if (!current) {
        throw new Error('Tu dois être connecté pour générer un lien');
      }
      const token = await current.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
      const resp = await fetch(`${apiBase}/api/generate-referral-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId })
      });
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json?.error || 'Erreur lors de la génération du lien');
      }
      return json;
    },
    onSuccess: (data, productId) => {
      const product = products.find((p) => p.id === productId);
      const appPublic = import.meta.env.VITE_APP_PUBLIC_URL || 'https://click-earn-pwa.vercel.app';
      let finalUrl: string = data?.url || "";
      try {
        const u = new URL(finalUrl);
        finalUrl = `${appPublic}${u.pathname}${u.search}`;
      } catch {
        finalUrl = String(finalUrl).replace(/https?:\/\/[^/]*lovable\.app/gi, appPublic);
      }
      setReferralUrl(finalUrl);
      setSelectedProduct(product || null);
      setShareModalOpen(true);
      toast.success("Ton lien est prêt ! Partage-le maintenant pour gagner tes commissions.");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "Erreur lors de la génération du lien");
    }
  });

  const handleRecommend = (productId: string) => {
    const auth = getAuth();
    if (!auth.currentUser) {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { intent: 'recommend' } }));
      return;
    }
    generateLinkMutation.mutate(productId);
  };

  const handleViewDetails = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const formatSaleCommissionAmount = (product: Product) => {
    const price = Number(product.price || 0);
    const type = String(product.commission_type || 'percentage');
    const value = Number(product.commission_value || 0);
    const amount = type === 'percentage' ? price * (value / 100) : value;
    return formatPrice(Math.max(0, amount));
  };

  const formatClickCommission = (product: Product) => {
    const click = Number(product.click_commission || 0);
    const fallback = Number((commissionSettings || [])?.find?.((s: any) => s.key === 'click_commission')?.value || 0);
    const value = click || fallback;
    if (!value) return null;
    return formatPrice(value);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('fr-FR')} FCFA`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="mb-2 text-3xl font-bold">Catalogue produits</h1>
          <p className="text-muted-foreground">
            {products.length} produits disponibles à la recommandation
          </p>
        </div>

        {products.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Aucun produit disponible pour le moment.</p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product: Product, index: number) => (
              <Card
                key={product.id}
                className="group overflow-hidden shadow-card transition-all hover:shadow-elegant hover:-translate-y-1 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Product Image */}
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                  />
                  {product.stock_quantity && product.stock_quantity < 10 && (
                    <Badge className="absolute right-2 top-2 bg-red-500 border-0">
                      Stock limité
                    </Badge>
                  )}
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline" className="text-xs">{product.category}</Badge>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatPrice(product.price)}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="rounded-lg bg-gradient-to-r from-secondary/10 to-primary/10 p-3 border border-secondary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Gain par commande</p>
                        <p className="text-lg font-bold text-secondary">{formatSaleCommissionAmount(product)}</p>
                        {formatClickCommission(product) && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-background/40">
                              <MousePointer className="h-3 w-3 mr-1" />
                              Clic: {formatClickCommission(product)}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Badge className="gradient-secondary border-0 text-sm">
                        Rentable
                      </Badge>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={() => handleViewDetails(product.id)}
                    variant="outline"
                    className="w-full sm:flex-1"
                    size="lg"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Détails
                  </Button>
                  <Button
                    onClick={() => handleRecommend(product.id)}
                    disabled={generateLinkMutation.isPending}
                    className="w-full sm:flex-1 gradient-primary hover:opacity-90 transition-opacity font-semibold"
                    size="lg"
                  >
                    {generateLinkMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-xs opacity-90">Gagner {formatSaleCommissionAmount(product)}</span>
                      <span>Recommander</span>
                    </span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modal de partage */}
      {selectedProduct && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          productName={selectedProduct.name}
          referralUrl={referralUrl}
          commission={formatSaleCommissionAmount(selectedProduct)}
        />
      )}
    </div>
  );
};

export default Products;
