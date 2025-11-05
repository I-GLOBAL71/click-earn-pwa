import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminSettings = () => {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres Système</h1>
        <p className="text-muted-foreground mt-2">
          Configuration globale de la plateforme
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Les paramètres système seront implémentés ici
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
