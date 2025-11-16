import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import shareImg from "@/assets/onboarding-share.jpg";
import earnImg from "@/assets/onboarding-earn.jpg";
import successImg from "@/assets/onboarding-success.jpg";

const steps = [
  {
    icon: "🚀",
    title: "Partagez",
    subtitle: "Recommandez des produits",
    background: shareImg
  },
  {
    icon: "💰",
    title: "Gagnez",
    subtitle: "Touchez vos commissions",
    background: earnImg
  },
  {
    icon: "📈",
    title: "Réussissez",
    subtitle: "Sans limite de revenus",
    background: successImg
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
    <div className="h-screen relative overflow-hidden flex flex-col">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: `url(${step.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>
      
      {/* Skip button */}
      <div className="absolute top-6 right-6 z-10">
        <Button 
          variant="ghost" 
          onClick={handleSkip}
          className="text-white/80 hover:text-white hover:bg-white/10"
        >
          Passer
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
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
            <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
              {step.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 drop-shadow-md">
              {step.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="pb-12 px-6 space-y-8 relative z-10">
        {/* Progress bar */}
        <div className="max-w-xs mx-auto">
          <Progress value={progress} className="h-1 bg-white/20" />
        </div>

        {/* Next button */}
        <div className="flex justify-center">
          <Button
            onClick={handleNext}
            size="lg"
            className="min-w-[240px] group bg-white text-black hover:bg-white/90 rounded-full px-8 py-6 text-lg font-semibold shadow-2xl"
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
