import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";

const ReferralRedirect = () => {
  const navigate = useNavigate();
  const { code } = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const run = async () => {
      if (!code) {
        navigate("/products");
        return;
      }
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
        await fetch(`${apiBase}/api/track-click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code })
        });
      } catch (_) {
        // ignore tracking errors for UX
      }
      const productId = searchParams.get("utm_campaign");
      if (productId) navigate(`/products/${productId}`);
      else navigate("/products");
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Redirection en cours…</span>
        </div>
      </main>
    </div>
  );
};

export default ReferralRedirect;