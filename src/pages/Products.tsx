import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, TrendingUp, Eye } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const products = [
  {
    id: 1,
    name: "Écouteurs Bluetooth Pro",
    category: "Audio",
    price: "€89.99",
    commission: "15%",
    commissionValue: "€13.50",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=300&fit=crop",
    trending: true,
  },
  {
    id: 2,
    name: "Montre connectée Sport",
    category: "Wearables",
    price: "€249.99",
    commission: "10%",
    commissionValue: "€25.00",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
    trending: true,
  },
  {
    id: 3,
    name: "Chargeur sans fil rapide",
    category: "Accessoires",
    price: "€39.99",
    commission: "20%",
    commissionValue: "€8.00",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=300&fit=crop",
    trending: false,
  },
  {
    id: 4,
    name: "Casque audio Premium",
    category: "Audio",
    price: "€299.99",
    commission: "12%",
    commissionValue: "€36.00",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    trending: true,
  },
  {
    id: 5,
    name: "Souris ergonomique Pro",
    category: "Informatique",
    price: "€79.99",
    commission: "18%",
    commissionValue: "€14.40",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop",
    trending: false,
  },
  {
    id: 6,
    name: "Webcam 4K Ultra HD",
    category: "Informatique",
    price: "€149.99",
    commission: "15%",
    commissionValue: "€22.50",
    image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&h=300&fit=crop",
    trending: false,
  },
];

const Products = () => {
  const navigate = useNavigate();

  const handleRecommend = (productName: string) => {
    toast.success(`Lien de recommandation généré pour "${productName}" !`, {
      description: "Le lien a été copié dans votre presse-papier.",
    });
  };

  const handleViewDetails = (productId: number) => {
    navigate(`/products/${productId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="mb-2 text-3xl font-bold">Catalogue produits</h1>
          <p className="text-muted-foreground">
            Découvrez tous les produits disponibles à la recommandation
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <Card
              key={product.id}
              className="group overflow-hidden shadow-card transition-all hover:shadow-elegant hover:-translate-y-1 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Product Image */}
              <div className="relative aspect-video overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
                {product.trending && (
                  <Badge className="absolute right-2 top-2 gradient-secondary border-0">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Tendance
                  </Badge>
                )}
              </div>

              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.category}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{product.price}</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between rounded-lg bg-secondary/10 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Commission</p>
                    <p className="text-lg font-bold text-secondary">{product.commissionValue}</p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {product.commission}
                  </Badge>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  onClick={() => handleViewDetails(product.id)}
                  variant="default"
                  className="flex-1"
                  size="lg"
                >
                  <Eye className="h-4 w-4" />
                  Voir détails
                </Button>
                <Button
                  onClick={() => handleRecommend(product.name)}
                  variant="hero"
                  className="flex-1"
                  size="lg"
                >
                  <Share2 className="h-4 w-4" />
                  Recommander
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Products;
