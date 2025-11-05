import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAmbassadors: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingPayouts: 0,
    totalOrders: 0,
    totalClicks: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Load ambassadors count
    const { count: ambassadorsCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ambassador');

    // Load products count
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Load total revenue from commissions
    const { data: commissionsData } = await supabase
      .from('commissions')
      .select('amount')
      .eq('status', 'approved');

    const totalRevenue = commissionsData?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

    // Load pending payouts
    const { data: payoutsData } = await supabase
      .from('payouts')
      .select('amount')
      .eq('status', 'pending');

    const pendingPayouts = payoutsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Load orders count
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Load total clicks
    const { data: linksData } = await supabase
      .from('referral_links')
      .select('clicks');

    const totalClicks = linksData?.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0;

    setStats({
      totalAmbassadors: ambassadorsCount || 0,
      totalProducts: productsCount || 0,
      totalRevenue,
      pendingPayouts,
      totalOrders: ordersCount || 0,
      totalClicks,
    });
  };

  const statCards = [
    {
      title: "Ambassadeurs Actifs",
      value: stats.totalAmbassadors,
      icon: Users,
      trend: "+12%",
      trendUp: true,
      color: "text-blue-500",
    },
    {
      title: "Produits Actifs",
      value: stats.totalProducts,
      icon: Package,
      trend: "+5",
      trendUp: true,
      color: "text-purple-500",
    },
    {
      title: "Revenus Totaux",
      value: `${stats.totalRevenue.toLocaleString()} FCFA`,
      icon: DollarSign,
      trend: "+23%",
      trendUp: true,
      color: "text-green-500",
    },
    {
      title: "Paiements en Attente",
      value: `${stats.pendingPayouts.toLocaleString()} FCFA`,
      icon: TrendingUp,
      trend: "+8%",
      trendUp: true,
      color: "text-orange-500",
    },
    {
      title: "Commandes Totales",
      value: stats.totalOrders,
      icon: Package,
      trend: "+18%",
      trendUp: true,
      color: "text-indigo-500",
    },
    {
      title: "Clics Totaux",
      value: stats.totalClicks,
      icon: TrendingUp,
      trend: "+45%",
      trendUp: true,
      color: "text-pink-500",
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de votre plateforme RewardLink
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="shadow-card hover:shadow-elegant transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                {stat.trendUp ? (
                  <ArrowUpRight className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                )}
                <span className={stat.trendUp ? "text-success" : "text-destructive"}>
                  {stat.trend}
                </span>
                <span className="text-muted-foreground ml-1">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Activités Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Les activités récentes apparaîtront ici
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top Ambassadeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Les meilleurs ambassadeurs apparaîtront ici
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
