import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminAnalytics = () => {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Rapports</h1>
        <p className="text-muted-foreground mt-2">
          Analyse détaillée des performances
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Rapports détaillés</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Les analytics détaillés seront implémentés ici
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
