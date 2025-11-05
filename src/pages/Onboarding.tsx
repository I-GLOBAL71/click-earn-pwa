import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Moon, Zap, Rocket, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    icon: Rocket,
    title: "Vos Revenus N'ont Plus de Limites",
    subtitle: "Transformez chaque clic en flux d'argent continu",
    description: "Imaginez des gains sans plafond, des revenus qui se multiplient, votre potentiel infini débloqué.",
    features: [
      "✓ Gains sans plafond",
      "✓ Revenus qui se multiplient", 
      "✓ Votre potentiel infini débloqué"
    ],
    emoji: "🚀",
    countFrom: 50000,
    countTo: 5000000,
    gradient: "from-primary/20 via-purple-500/20 to-secondary/20"
  },
  {
    icon: Zap,
    title: "1 Clic = 2 Coups de Génie",
    subtitle: "Amusez-vous tout en remplissant votre portefeuille",
    description: "La magie opère quand vous découvrez des produits exceptionnels, les partagez et l'argent arrive sans effort.",
    features: [
      "🎯 Découvrez des produits exceptionnels",
      "🤝 Partagez avec votre réseau",
      "💫 L'argent arrive sans effort"
    ],
    emoji: "💰",
    gradient: "from-secondary/20 via-yellow-500/20 to-primary/20"
  },
  {
    icon: Moon,
    title: "Votre Machine à Cash Automatique",
    subtitle: "Gagnez 24h/24, même dans vos rêves 🌙",
    description: "Le rêve devient réalité: vos gains vous attendent le matin, vos clics génèrent des revenus la journée, et votre argent travaille pour vous le soir.",
    features: [
      "🌅 Le matin: vos gains de la nuit vous attendent",
      "🌇 La journée: vos clics génèrent des revenus",
      "🌃 Le soir: votre argent travaille pour vous"
    ],
    emoji: "💤",
    gradient: "from-purple-500/20 via-primary/20 to-secondary/20"
  },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [counter, setCounter] = useState(50000);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();

  const step = steps[currentStep];
  const Icon = step.icon;

  // Animated counter for step 1
  useEffect(() => {
    if (currentStep === 0 && step.countFrom && step.countTo) {
      const duration = 3000;
      const steps = 60;
      const increment = (step.countTo - step.countFrom) / steps;
      let current = step.countFrom;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= step.countTo) {
          setCounter(step.countTo);
          clearInterval(timer);
        } else {
          setCounter(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [currentStep, step.countFrom, step.countTo]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        setCurrentStep(currentStep + 1);
        if (currentStep === 0) setCounter(50000);
      }, 500);
    } else {
      setShowConfetti(true);
      setTimeout(() => {
        navigate("/products");
      }, 800);
    }
  };

  const handleSkip = () => {
    navigate("/products");
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${step.gradient} relative overflow-hidden flex flex-col`}>
      {/* Animated background particles */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-scale-in"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: '1s'
              }}
            >
              {['💰', '⭐', '🎉', '💸'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      {/* Skip button */}
      <div className="container pt-6 relative z-10">
        <Button 
          variant="ghost" 
          onClick={handleSkip} 
          className="ml-auto block hover:bg-accent/50"
        >
          Explorer les produits →
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 container flex flex-col items-center justify-center px-6 py-8 relative z-10">
        <div className="w-full max-w-2xl space-y-6 animate-fade-in">
          {/* Animated Icon with emoji */}
          <div className="mx-auto relative">
            <div className="w-28 h-28 rounded-full gradient-primary flex items-center justify-center shadow-glow animate-pulse">
              <Icon className="w-14 h-14 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 text-4xl animate-bounce">
              {step.emoji}
            </div>
          </div>

          {/* Counter for step 1 */}
          {currentStep === 0 && (
            <div className="text-center">
              <div className="text-5xl sm:text-6xl font-bold gradient-primary bg-clip-text text-transparent animate-scale-in">
                {counter.toLocaleString('fr-FR')} FCFA
              </div>
              <div className="text-xl text-muted-foreground mt-2 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary animate-glow" />
                <span>→ ∞</span>
                <Sparkles className="w-5 h-5 text-secondary animate-glow" />
              </div>
            </div>
          )}

          {/* Split screen visual for step 2 */}
          {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="text-center p-4 rounded-lg bg-card/50 backdrop-blur-sm shadow-card animate-slide-up">
                <div className="text-4xl mb-2">🎮</div>
                <div className="text-sm text-muted-foreground">Découvrez</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/50 backdrop-blur-sm shadow-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="text-4xl mb-2">💸</div>
                <div className="text-sm text-muted-foreground">Gagnez</div>
              </div>
            </div>
          )}

          {/* Day/Night visual for step 3 */}
          {currentStep === 2 && (
            <div className="flex items-center justify-center gap-4 my-6">
              <div className="text-center p-3 rounded-full bg-card/50 backdrop-blur-sm shadow-card animate-scale-in">
                <div className="text-3xl">🌞</div>
              </div>
              <ArrowRight className="w-6 h-6 text-primary animate-pulse" />
              <div className="text-center p-3 rounded-full bg-card/50 backdrop-blur-sm shadow-card animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <div className="text-3xl">🌙</div>
              </div>
              <ArrowRight className="w-6 h-6 text-secondary animate-pulse" style={{ animationDelay: '0.1s' }} />
              <div className="text-center p-3 rounded-full bg-card/50 backdrop-blur-sm shadow-card animate-scale-in" style={{ animationDelay: '0.4s' }}>
                <div className="text-3xl">💰</div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {step.title}
            </h1>
            <p className="text-lg sm:text-xl text-primary font-semibold italic">
              {step.subtitle}
            </p>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              {step.description}
            </p>
          </div>

          {/* Features list */}
          <div className="space-y-3 max-w-md mx-auto">
            {step.features.map((feature, index) => (
              <div
                key={index}
                className="text-left p-3 rounded-lg bg-card/50 backdrop-blur-sm shadow-card animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <p className="text-sm sm:text-base font-medium">{feature}</p>
              </div>
            ))}
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2 pt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? "w-12 gradient-primary shadow-glow"
                    : index < currentStep
                    ? "w-2 bg-secondary"
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
            className="w-full group text-lg font-bold"
          >
            {currentStep < steps.length - 1 ? (
              <>
                {currentStep === 0 ? "Je veux gagner plus" : "Voir la magie"}
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </>
            ) : (
              <>
                🚀 DÉMARRER MA MACHINE À CASH
                <Sparkles className="h-6 w-6 animate-glow" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
