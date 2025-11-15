import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const steps = [
  {
    icon: "🚀",
    title: "Partagez",
    subtitle: "Recommandez des produits"
  },
  {
    icon: "💰",
    title: "Gagnez",
    subtitle: "Touchez vos commissions"
  },
  {
    icon: "📈",
    title: "Réussissez",
    subtitle: "Sans limite de revenus"
  },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/products");
    }
  };

  const handleSkip = () => {
    navigate("/products");
  };

  return (
    <div className="h-screen gradient-hero relative overflow-hidden flex flex-col">
      {/* Floating shapes animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Skip button */}
      <div className="absolute top-6 right-6 z-10">
        <Button 
          variant="ghost" 
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          Passer
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center space-y-12">
          
          {/* Icon with animation */}
          <div 
            key={currentStep}
            className="text-9xl animate-scale-in"
          >
            {step.icon}
          </div>

          {/* Title and subtitle */}
          <div 
            key={`text-${currentStep}`}
            className="space-y-4 animate-fade-in"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              {step.title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              {step.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="pb-12 px-6 space-y-8">
        {/* Progress bar */}
        <div className="max-w-xs mx-auto">
          <Progress value={progress} className="h-1" />
        </div>

        {/* Next button */}
        <div className="flex justify-center">
          <Button
            onClick={handleNext}
            size="xl"
            variant="hero"
            className="min-w-[240px] group shadow-glow"
          >
            {currentStep === steps.length - 1 ? "Commencer" : "Suivant"}
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
