import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAuth } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Info, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const commissionSchema = z.object({
  click_commission: z
    .string()
    .refine((val) => {
      const n = Number(String(val).replace(',', '.'));
      return !isNaN(n) && n >= 0;
    }, { message: "Le montant doit être un nombre positif" }),
  min_payout_amount: z
    .string()
    .refine((val) => {
      const n = Number(String(val).replace(',', '.'));
      return !isNaN(n) && n >= 0;
    }, { message: "Le montant doit être un nombre positif" }),
});

type CommissionFormData = z.infer<typeof commissionSchema>;

export const AdminCommissions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["commission-settings"],
    queryFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase ? apiBase + '/api' : '/api'}/commission-settings`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CommissionFormData>({
    resolver: zodResolver(commissionSchema),
    values: {
      click_commission: settings?.find((s) => s.key === "click_commission")?.value?.toString() || "0.1",
      min_payout_amount: settings?.find((s) => s.key === "min_payout_amount")?.value?.toString() || "5000",
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: CommissionFormData) => {
      const updates = [
        { key: "click_commission", value: parseFloat(String(data.click_commission).replace(',', '.')) },
        { key: "min_payout_amount", value: parseFloat(String(data.min_payout_amount).replace(',', '.')) },
      ];
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase ? apiBase + '/api' : '/api'}/commission-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-settings"] });
      toast({
        title: "Succès",
        description: "Configuration mise à jour avec succès",
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: "Erreur",
        description: message || "Impossible de mettre à jour la configuration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommissionFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const { data: categoryCommissions = [], isLoading: catLoading, refetch: refetchCat } = useQuery({
    queryKey: ["category-commissions"],
    queryFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase ? apiBase + '/api' : '/api'}/admin/category-commissions`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  });

  const [cat, setCat] = React.useState("");
  const [catType, setCatType] = React.useState("percentage");
  const [catValue, setCatValue] = React.useState("");

  const saveCatMutation = useMutation({
    mutationFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase ? apiBase + '/api' : '/api'}/admin/category-commissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ category: cat.trim(), commission_type: catType, commission_value: parseFloat(catValue) })
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => { refetchCat(); setCat(""); setCatValue(""); toast({ title: "Règle enregistrée" }); },
    onError: (e: any) => toast({ title: "Erreur", description: e?.message || "Impossible d'enregistrer", variant: "destructive" })
  });

  const removeCatMutation = useMutation({
    mutationFn: async (category: string) => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase ? apiBase + '/api' : '/api'}/admin/category-commissions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ category })
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => { refetchCat(); toast({ title: "Règle supprimée" }); },
    onError: (e: any) => toast({ title: "Erreur", description: e?.message || "Impossible de supprimer", variant: "destructive" })
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuration des Commissions</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les taux et règles de commissions pour les ambassadeurs
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Les ambassadeurs sont rémunérés de deux façons : par clic sur leurs liens de parrainage et par commission sur les ventes de produits.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Configuration globale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="click_commission">
                Commission par clic (FCFA)
              </Label>
              <Input
                id="click_commission"
                type="number"
                step="0.01"
                placeholder="0.1"
                {...register("click_commission")}
              />
              {errors.click_commission && (
                <p className="text-sm text-destructive">{errors.click_commission.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Montant versé à l'ambassadeur chaque fois qu'un utilisateur clique sur son lien de parrainage
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_payout_amount">
                Montant minimum de retrait (FCFA)
              </Label>
              <Input
                id="min_payout_amount"
                type="number"
                step="1"
                placeholder="5000"
                {...register("min_payout_amount")}
              />
              {errors.min_payout_amount && (
                <p className="text-sm text-destructive">{errors.min_payout_amount.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Montant minimum que l'ambassadeur doit accumuler avant de pouvoir demander un retrait
              </p>
            </div>

            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Commissions par produit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Les commissions par produit sont configurées individuellement dans la section{" "}
              <span className="font-medium text-foreground">Gestion des Produits</span>.
            </p>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Deux types de commissions par produit :</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Pourcentage</strong> : Un pourcentage du prix du produit (ex: 10%)</li>
                  <li><strong>Montant fixe</strong> : Un montant fixe en FCFA par vente (ex: 500 FCFA)</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type de commission</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Pourcentage</TableCell>
                    <TableCell>
                      L'ambassadeur reçoit un pourcentage du prix de vente du produit
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Montant fixe</TableCell>
                    <TableCell>
                      L'ambassadeur reçoit un montant fixe pour chaque vente du produit
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3">
              <p className="font-medium">Règles par catégorie</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input placeholder="Catégorie (ex: Audio)" value={cat} onChange={(e) => setCat(e.target.value)} />
                <Select value={catType} onValueChange={setCatType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe (FCFA)</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder={catType === 'percentage' ? '10' : '500'} value={catValue} onChange={(e) => setCatValue(e.target.value)} />
                <Button onClick={() => saveCatMutation.mutate()} disabled={saveCatMutation.isPending || !cat || !catValue}>Enregistrer</Button>
              </div>
              <div className="rounded-md border">
                {catLoading ? (
                  <div className="p-4 text-muted-foreground">Chargement…</div>
                ) : categoryCommissions.length === 0 ? (
                  <div className="p-4 text-muted-foreground">Aucune règle</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Valeur</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryCommissions.map((c: any) => (
                        <TableRow key={c.category}>
                          <TableCell className="font-medium">{c.category}</TableCell>
                          <TableCell>{c.commission_type}</TableCell>
                          <TableCell>{c.commission_type === 'percentage' ? `${c.commission_value}%` : `${Number(c.commission_value).toLocaleString('fr-FR')} FCFA`}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => removeCatMutation.mutate(c.category)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
