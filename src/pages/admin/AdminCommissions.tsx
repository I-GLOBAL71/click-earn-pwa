import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminCommissions = () => {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuration des Commissions</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les taux et règles de commissions
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Configuration globale</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            La configuration des commissions sera implémentée ici
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
