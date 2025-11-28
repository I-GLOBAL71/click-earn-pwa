import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Euro, MousePointerClick, ShoppingCart, Share2, Copy, Award } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";

const stats = [
  {
    title: "Revenus totaux",
    value: "€432.50",
    change: "+12.5%",
    icon: Euro,
    color: "text-secondary",
  },
  {
    title: "Clics ce mois",
    value: "1,284",
    change: "+23.1%",
    icon: MousePointerClick,
    color: "text-primary",
  },
  {
    title: "Commandes générées",
    value: "47",
    change: "+8.2%",
    icon: ShoppingCart,
    color: "text-secondary",
  },
  {
    title: "Taux de conversion",
    value: "3.66%",
    change: "+0.5%",
    icon: TrendingUp,
    color: "text-primary",
  },
];

const recentActivities = [
  { product: "Écouteurs Bluetooth Pro", commission: "€12.50", date: "Il y a 2h", type: "recommendation" },
  { product: "Montre connectée Sport", commission: "€25.00", date: "Il y a 5h", type: "recommendation" },
  { product: "Chargeur sans fil rapide", commission: "€8.30", date: "Hier", type: "recommendation" },
  { product: "Casque audio Premium", commission: "€32.00", date: "Hier", type: "recommendation" },
];

const formatFcfa = (n: number) => `${Number(n||0).toLocaleString('fr-FR')} FCFA`;

const Dashboard = () => {
  const referralLink = "https://rewardlink.com/r/abc123xyz";

  const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
  const { data: myOrders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return [];
      const resp = await fetch(`${apiBase}/api/orders`, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) return [];
      return resp.json();
    }
  });

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Lien copié dans le presse-papier !");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full gradient-primary p-2">
              <Award className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Tableau de bord ambassadeur</h1>
          </div>
          <p className="text-muted-foreground">
            Suivez vos commandes, performances et gérez vos recommandations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="shadow-card transition-all hover:shadow-elegant animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="mt-1 text-xs text-secondary">
                  <span className="font-medium">{stat.change}</span> vs. mois dernier
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity Tabs */}
          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Activité</CardTitle>
              <CardDescription>Vos commandes et recommandations</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="recommendations" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
                  <TabsTrigger value="orders">Mes commandes</TabsTrigger>
                </TabsList>
                <TabsContent value="recommendations" className="space-y-4 mt-4">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{activity.product}</p>
                        <p className="text-sm text-muted-foreground">{activity.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-secondary">+{activity.commission}</p>
                        <p className="text-xs text-muted-foreground">Commission</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="orders" className="space-y-4 mt-4">
                  {myOrders.length === 0 ? (
                    <div className="p-4 text-muted-foreground">Aucune commande pour l’instant</div>
                  ) : (
                    myOrders.map((order: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:bg-accent/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{order.invoice?.product?.name || order.product_id}</p>
                          <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString('fr-FR')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatFcfa(order.total_amount)}</p>
                          <p className="text-xs text-secondary">Économisé: {formatFcfa(order.discount_amount)}</p>
                          <p className="text-xs text-muted-foreground">{order.status}</p>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Ambassador Link Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Votre lien ambassadeur</CardTitle>
              <CardDescription>Partagez ce lien pour gagner des commissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted p-3">
                <p className="break-all text-sm font-mono">{referralLink}</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button onClick={copyLink} className="w-full" variant="default">
                  <Copy className="h-4 w-4" />
                  Copier le lien
                </Button>
                <Button variant="secondary" className="w-full">
                  <Share2 className="h-4 w-4" />
                  Partager
                </Button>
              </div>

              <div className="rounded-lg gradient-hero p-4">
                <p className="text-sm font-medium mb-2">💡 Conseil ambassadeur</p>
                <p className="text-sm text-muted-foreground">
                  Commandez à prix ambassadeur et recommandez vos produits préférés sur les réseaux sociaux pour maximiser vos gains !
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
