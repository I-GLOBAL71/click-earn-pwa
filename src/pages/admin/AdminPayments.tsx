import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminPayments = () => {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Paiements</h1>
        <p className="text-muted-foreground mt-2">
          Validation et traitement des paiements
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Paiements en attente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            La gestion des paiements sera implémentée ici
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
