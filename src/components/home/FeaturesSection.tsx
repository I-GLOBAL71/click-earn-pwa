import { TrendingUp, Shield, Zap, BarChart3, Share2, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "Recommandation en 1 clic",
    description: "Partagez vos produits préférés instantanément via un lien unique personnalisé.",
    color: "text-primary",
  },
  {
    icon: Wallet,
    title: "Commissions transparentes",
    description: "Suivez vos gains en temps réel avec un tableau de bord détaillé et intuitif.",
    color: "text-secondary",
  },
  {
    icon: Shield,
    title: "Protection anti-fraude",
    description: "Système avancé de détection pour garantir des revenus légitimes et sécurisés.",
    color: "text-primary",
  },
  {
    icon: Share2,
    title: "Partage multi-canaux",
    description: "Diffusez vos liens sur tous les réseaux sociaux et applications de messagerie.",
    color: "text-secondary",
  },
  {
    icon: BarChart3,
    title: "Analytics détaillés",
    description: "Analysez vos performances et optimisez vos recommandations avec des insights précis.",
    color: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "Croissance garantie",
    description: "Augmentez vos revenus passifs en élargissant votre réseau de recommandations.",
    color: "text-secondary",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 lg:py-32">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Tout ce dont vous avez besoin pour
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              réussir vos recommandations
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Une plateforme complète pensée pour maximiser vos gains et simplifier votre expérience.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-border bg-card p-6 shadow-card transition-all hover:shadow-elegant hover:-translate-y-1 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
              
              {/* Hover gradient effect */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition-opacity group-hover:opacity-100" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
