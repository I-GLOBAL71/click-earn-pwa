import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero opacity-50" />
      
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            <Zap className="h-4 w-4" />
            Plateforme ambassadeur exclusive
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Devenez ambassadeur et
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              gagnez sur chaque recommandation
            </span>
          </h1>

          {/* Description */}
          <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
            Commandez à prix ambassadeur avec remises automatiques et partagez vos produits favoris pour gagner des commissions généreuses. 
            Simple, transparent et rémunérateur.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button variant="hero" size="xl" asChild className="group">
              <Link to="/auth?mode=signup">
                Commencer gratuitement
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/products">Voir les produits</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border/50 pt-12">
            <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="mb-2 text-3xl font-bold text-primary">10%</div>
              <div className="text-sm text-muted-foreground">Commission moyenne</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="mb-2 text-3xl font-bold text-secondary">100+</div>
              <div className="text-sm text-muted-foreground">Produits disponibles</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="mb-2 text-3xl font-bold text-primary">24h</div>
              <div className="text-sm text-muted-foreground">Paiement rapide</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
