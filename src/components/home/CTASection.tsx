import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const CTASection = () => {
  return (
    <section className="py-20 lg:py-32">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-12 shadow-elegant lg:p-16">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
          
          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
              Prêt à générer vos premiers revenus ?
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/90 sm:text-xl">
              Rejoignez des milliers d'utilisateurs qui gagnent déjà de l'argent en partageant leurs produits préférés.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                variant="secondary"
                size="xl"
                className="bg-white text-primary hover:bg-white/90 shadow-glow"
                onClick={() => { window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { intent: 'signup' } })); window.gtag?.('event','auth_modal_open',{ intent: 'signup' }); }}
              >
                Créer un compte gratuit
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                asChild
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <Link to="/products">Explorer les produits</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
