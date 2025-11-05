import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, name);
        if (error) throw error;
        toast.success("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
        setMode("login");
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Connexion réussie !");
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero opacity-30" />

      <div className="relative w-full max-w-md animate-scale-in">
        <Card className="border-border shadow-elegant">
          <CardHeader className="text-center">
            <Link to="/" className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </Link>
            <CardTitle className="text-2xl">
              {mode === "login" ? "Bon retour !" : "Créer un compte"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Connectez-vous pour accéder à votre dashboard"
                : "Rejoignez RewardLink et commencez à gagner"}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jean Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {mode === "login" && (
                <div className="text-right">
                  <Button variant="link" className="h-auto p-0 text-sm" type="button">
                    Mot de passe oublié ?
                  </Button>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === "login" ? "Connexion..." : "Création..."}
                  </>
                ) : (
                  mode === "login" ? "Se connecter" : "Créer mon compte"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>
                    Pas encore de compte ?{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => setMode("signup")}
                      type="button"
                    >
                      S'inscrire
                    </Button>
                  </>
                ) : (
                  <>
                    Déjà un compte ?{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => setMode("login")}
                      type="button"
                    >
                      Se connecter
                    </Button>
                  </>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
