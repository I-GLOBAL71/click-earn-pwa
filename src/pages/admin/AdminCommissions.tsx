import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const commissionSchema = z.object({
  click_commission: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Le montant doit être un nombre positif",
  }),
  min_payout_amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Le montant doit être un nombre positif",
  }),
});

type CommissionFormData = z.infer<typeof commissionSchema>;

export const AdminCommissions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["commission-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_settings")
        .select("*")
        .in("key", ["click_commission", "min_payout_amount"]);

      if (error) throw error;
      return data;
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
        {
          key: "click_commission",
          value: parseFloat(data.click_commission),
        },
        {
          key: "min_payout_amount",
          value: parseFloat(data.min_payout_amount),
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("commission_settings")
          .update({ value: update.value, updated_at: new Date().toISOString() })
          .eq("key", update.key);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-settings"] });
      toast({
        title: "Succès",
        description: "Configuration mise à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la configuration",
        variant: "destructive",
      });
      console.error("Error updating settings:", error);
    },
  });

  const onSubmit = (data: CommissionFormData) => {
    updateSettingsMutation.mutate(data);
  };

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
