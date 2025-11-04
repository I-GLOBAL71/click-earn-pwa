import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, ShoppingBag, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    icon: Award,
    title: "Devenez ambassadeur",
    description: "Rejoignez une communauté exclusive d'ambassadeurs et accédez à des produits premium avec des remises exceptionnelles.",
    highlight: "Remises jusqu'à 20%",
  },
  {
    icon: ShoppingBag,
    title: "Commandez à prix ambassadeur",
    description: "Profitez de remises automatiques sur tous vos achats et découvrez des produits tendance avant tout le monde.",
    highlight: "Prix exclusifs garantis",
  },
  {
    icon: TrendingUp,
    title: "Recommandez et gagnez",
    description: "Partagez vos produits préférés avec votre réseau et recevez des commissions généreuses sur chaque vente générée.",
    highlight: "Commissions de 10-20%",
  },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/auth?mode=signup");
    }
  };

  const handleSkip = () => {
    navigate("/auth?mode=signup");
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex flex-col">
      {/* Skip button */}
      <div className="container pt-6">
        <Button variant="ghost" onClick={handleSkip} className="ml-auto block">
          Passer
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 container flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Icon */}
          <div className="mx-auto w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Icon className="w-12 h-12 text-white" />
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {step.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {step.description}
            </p>
            <div className="inline-block px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
              <p className="text-sm font-semibold text-secondary">{step.highlight}</p>
            </div>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-primary"
                    : index < currentStep
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Action button */}
          <Button
            onClick={handleNext}
            variant="hero"
            size="xl"
            className="w-full group"
          >
            {currentStep < steps.length - 1 ? "Suivant" : "Commencer"}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
