import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Euro, MousePointerClick, ShoppingCart, Share2, Copy } from "lucide-react";
import { toast } from "sonner";

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
  { product: "Écouteurs Bluetooth Pro", commission: "€12.50", date: "Il y a 2h" },
  { product: "Montre connectée Sport", commission: "€25.00", date: "Il y a 5h" },
  { product: "Chargeur sans fil rapide", commission: "€8.30", date: "Hier" },
  { product: "Casque audio Premium", commission: "€32.00", date: "Hier" },
];

const Dashboard = () => {
  const referralLink = "https://rewardlink.com/r/abc123xyz";

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
          <h1 className="mb-2 text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Suivez vos performances et gérez vos recommandations
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
          {/* Recent Activity */}
          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Vos dernières commissions générées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                      <p className="font-semibold text-secondary">{activity.commission}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Referral Link Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Votre lien de parrainage</CardTitle>
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
                <p className="text-sm font-medium mb-2">💡 Conseil</p>
                <p className="text-sm text-muted-foreground">
                  Partagez vos produits préférés sur les réseaux sociaux pour maximiser vos gains !
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
