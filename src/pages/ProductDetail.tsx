import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Share2, TrendingUp, ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";

// Mock products data - ideally this would come from a backend
const products = [
  {
    id: 1,
    name: "Écouteurs Bluetooth Pro",
    category: "Audio",
    price: 89.99,
    commission: 15,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=600&fit=crop",
    trending: true,
    description: "Écouteurs sans fil haute qualité avec réduction de bruit active. Batterie longue durée de 24h. Son cristallin et basses profondes.",
    features: ["Réduction de bruit active", "24h d'autonomie", "Bluetooth 5.0", "Étanche IPX7"],
  },
  {
    id: 2,
    name: "Montre connectée Sport",
    category: "Wearables",
    price: 249.99,
    commission: 10,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
    trending: true,
    description: "Montre intelligente avec suivi fitness avancé et notifications. GPS intégré et résistante à l'eau.",
    features: ["GPS intégré", "Suivi santé 24/7", "Notifications smartphone", "Étanche 50m"],
  },
  {
    id: 3,
    name: "Chargeur sans fil rapide",
    category: "Accessoires",
    price: 39.99,
    commission: 20,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&h=600&fit=crop",
    trending: false,
    description: "Chargeur sans fil ultra-rapide compatible avec tous les smartphones. Design élégant et compact.",
    features: ["Charge rapide 15W", "Compatible universel", "Protection surchauffe", "LED indicateur"],
  },
  {
    id: 4,
    name: "Casque audio Premium",
    category: "Audio",
    price: 299.99,
    commission: 12,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
    trending: true,
    description: "Casque audio haut de gamme avec son Hi-Fi et réduction de bruit. Confort maximal pour de longues sessions.",
    features: ["Son Hi-Fi", "Réduction bruit ANC", "40h d'autonomie", "Coussinets mémoire"],
  },
  {
    id: 5,
    name: "Souris ergonomique Pro",
    category: "Informatique",
    price: 79.99,
    commission: 18,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=600&fit=crop",
    trending: false,
    description: "Souris ergonomique professionnelle pour un confort optimal. Précision gaming et productivité.",
    features: ["Design ergonomique", "DPI ajustable", "6 boutons programmables", "Sans fil 2.4GHz"],
  },
  {
    id: 6,
    name: "Webcam 4K Ultra HD",
    category: "Informatique",
    price: 149.99,
    commission: 15,
    image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&h=600&fit=crop",
    trending: false,
    description: "Webcam 4K professionnelle avec autofocus et microphone stéréo. Idéale pour le streaming et visioconférences.",
    features: ["Qualité 4K 30fps", "Autofocus rapide", "Micro stéréo", "Correction lumière"],
  },
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isOrdering, setIsOrdering] = useState(false);

  const product = products.find((p) => p.id === Number(id));

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <p>Produit non trouvé</p>
        </main>
      </div>
    );
  }

  const ambassadorPrice = product.price * (1 - product.commission / 100);
  const savings = product.price - ambassadorPrice;

  const handleOrder = () => {
    setIsOrdering(true);
    setTimeout(() => {
      toast.success(`Commande confirmée pour "${product.name}"!`, {
        description: `Vous avez économisé €${savings.toFixed(2)} avec votre remise ambassadeur.`,
      });
      setIsOrdering(false);
      navigate("/dashboard");
    }, 1500);
  };

  const handleRecommend = () => {
    toast.success(`Lien de recommandation généré pour "${product.name}"!`, {
      description: "Le lien a été copié dans votre presse-papier.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/products")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux produits
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted animate-fade-in">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {product.trending && (
              <Badge className="absolute right-4 top-4 gradient-secondary border-0">
                <TrendingUp className="mr-1 h-3 w-3" />
                Tendance
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6 animate-slide-up">
            <div>
              <Badge variant="secondary" className="mb-3">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {/* Features */}
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Caractéristiques</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-secondary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Pricing Card */}
            <Card className="shadow-elegant gradient-hero border-0">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground line-through">
                      Prix public: €{product.price.toFixed(2)}
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      €{ambassadorPrice.toFixed(2)}
                    </p>
                    <p className="text-sm font-medium text-secondary">
                      Prix ambassadeur (-{product.commission}%)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Vous économisez</p>
                    <p className="text-2xl font-bold text-secondary">
                      €{savings.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleOrder}
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isOrdering}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {isOrdering ? "Commande en cours..." : "Commander maintenant"}
                  </Button>
                  <Button
                    onClick={handleRecommend}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    <Share2 className="h-4 w-4" />
                    Recommander et gagner €{(ambassadorPrice * product.commission / 100).toFixed(2)}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ambassador Info */}
            <Card className="shadow-card bg-secondary/5 border-secondary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-secondary/10 p-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Avantage ambassadeur</h4>
                    <p className="text-sm text-muted-foreground">
                      En tant qu'ambassadeur, vous bénéficiez automatiquement de {product.commission}% 
                      de remise sur tous vos achats. Recommandez ce produit et gagnez également {product.commission}% 
                      de commission sur chaque vente générée.
                    </p>
                  </div>
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
