import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MoreVertical, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Ambassador {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  total_commissions: number;
  total_clicks: number;
}

export const AdminAmbassadors = () => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAmbassadors();
  }, []);

  const loadAmbassadors = async () => {
    try {
      // Get all users with ambassador role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'ambassador');

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) {
        setAmbassadors([]);
        setLoading(false);
        return;
      }

      const userIds = roleData.map(r => r.user_id);

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Get commissions stats
      const { data: commissionsData } = await supabase
        .from('commissions')
        .select('user_id, amount')
        .in('user_id', userIds);

      // Get clicks stats
      const { data: linksData } = await supabase
        .from('referral_links')
        .select('user_id, clicks')
        .in('user_id', userIds);

      // Combine data
      const ambassadorsData = profiles?.map(profile => {
        const userCommissions = commissionsData?.filter(c => c.user_id === profile.id) || [];
        const totalCommissions = userCommissions.reduce((sum, c) => sum + Number(c.amount), 0);
        
        const userLinks = linksData?.filter(l => l.user_id === profile.id) || [];
        const totalClicks = userLinks.reduce((sum, l) => sum + (l.clicks || 0), 0);

        return {
          id: profile.id,
          full_name: profile.full_name,
          email: '', // We'll need to fetch this separately or store in profile
          phone: profile.phone,
          created_at: profile.created_at,
          total_commissions: totalCommissions,
          total_clicks: totalClicks,
        };
      }) || [];

      setAmbassadors(ambassadorsData);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAmbassadors = ambassadors.filter(amb =>
    amb.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    amb.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Ambassadeurs</h1>
          <p className="text-muted-foreground mt-2">
            Gérez et suivez vos ambassadeurs
          </p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un ambassadeur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filteredAmbassadors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun ambassadeur trouvé
            </p>
          ) : (
            <div className="space-y-4">
              {filteredAmbassadors.map((ambassador) => (
                <div
                  key={ambassador.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-smooth"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">
                        {ambassador.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{ambassador.full_name || 'Sans nom'}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        {ambassador.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{ambassador.email}</span>
                          </div>
                        )}
                        {ambassador.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{ambassador.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {ambassador.total_commissions.toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-muted-foreground">Commissions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{ambassador.total_clicks}</p>
                      <p className="text-xs text-muted-foreground">Clics</p>
                    </div>
                    <Badge variant="secondary">Actif</Badge>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
