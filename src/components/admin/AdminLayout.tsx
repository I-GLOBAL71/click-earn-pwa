import { Outlet, NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  DollarSign, 
  BarChart3, 
  CreditCard,
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const AdminLayout = () => {
  const { signOut } = useAuth();

  const navItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/ambassadors", icon: Users, label: "Ambassadeurs" },
    { to: "/admin/products", icon: Package, label: "Produits" },
    { to: "/admin/commissions", icon: DollarSign, label: "Commissions" },
    { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/admin/payments", icon: CreditCard, label: "Paiements" },
    { to: "/admin/settings", icon: Settings, label: "Paramètres" },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            RewardLink Admin
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-elegant"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
