import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuth } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

const formatFcfa = (n: number) => `${Number(n||0).toLocaleString('fr-FR')} FCFA`;

export const AdminOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
      const res = await fetch(`${apiBase}/api/admin/orders`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOrders(data || []);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Impossible de charger les commandes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter((o) => {
    const p = String(o.product_name || o.product_id || "").toLowerCase();
    const u = String(o.user_id || "").toLowerCase();
    return p.includes(search.toLowerCase()) || u.includes(search.toLowerCase());
  });

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Commandes Ambassadeurs</h1>
        <p className="text-muted-foreground mt-2">Historique des commandes avec détails de remises</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par produit ou utilisateur" />
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Aucune commande</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Remise</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>{new Date(o.created_at).toLocaleString('fr-FR')}</TableCell>
                      <TableCell>{o.product_name || o.product_id}</TableCell>
                      <TableCell>{o.quantity}</TableCell>
                      <TableCell>{formatFcfa(o.total_amount)}</TableCell>
                      <TableCell>{formatFcfa(o.discount_amount)}</TableCell>
                      <TableCell>{o.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrders;

