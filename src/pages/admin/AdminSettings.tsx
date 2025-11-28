import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const AdminSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");

  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles-list"],
    queryFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
      const res = await fetch(`${apiBase}/api/admin/roles`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  });

  const assignRoleMutation = useMutation({
    mutationFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
      const res = await fetch(`${apiBase}/api/admin/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ email, role })
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      toast({ title: "Rôle attribué" });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["roles-list"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Erreur", description: message || "Impossible d'attribuer le rôle", variant: 'destructive' });
    }
  });

  const [geminiEnabled, setGeminiEnabled] = useState(false);
  const [geminiModel, setGeminiModel] = useState("gemini-1.5-flash");
  const [geminiTemperature, setGeminiTemperature] = useState("0.2");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiMasked, setGeminiMasked] = useState("");
  const [defaultTitlePrompt, setDefaultTitlePrompt] = useState("");
  const [defaultDescriptionPrompt, setDefaultDescriptionPrompt] = useState("");

  const { data: aiSettings, isLoading: aiLoading } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
      const urlPrimary = `${apiBase}/api/admin/system-settings`;
      const urlFallback = `${apiBase}/api/ai-settings`;
      const common = { headers: { Authorization: token ? `Bearer ${token}` : '' } };
      const res1 = await fetch(urlPrimary, common);
      if (res1.ok) return res1.json();
      const res2 = await fetch(urlFallback, common);
      if (!res2.ok) throw new Error(await res2.text());
      return res2.json();
    }
  });

  useEffect(() => {
    if (aiSettings) {
      setGeminiEnabled(String(aiSettings.gemini_enabled || "false").toLowerCase() === 'true');
      setGeminiModel(aiSettings.gemini_model || "gemini-1.5-flash");
      setGeminiTemperature(aiSettings.gemini_temperature || "0.2");
      setGeminiMasked(aiSettings.gemini_api_key_masked || "");
      setDefaultTitlePrompt(aiSettings.default_title_prompt || "");
      setDefaultDescriptionPrompt(aiSettings.default_description_prompt || "");
    }
  }, [aiSettings]);

  const saveAiMutation = useMutation({
    mutationFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
      const payload: any = {
        gemini_enabled: String(geminiEnabled),
        gemini_model: geminiModel,
        gemini_temperature: geminiTemperature,
        default_title_prompt: defaultTitlePrompt,
        default_description_prompt: defaultDescriptionPrompt,
      };
      if (geminiApiKey.trim()) payload.gemini_api_key = geminiApiKey.trim();
      const urlPrimary = `${apiBase}/api/admin/system-settings`;
      const urlFallback = `${apiBase}/api/ai-settings`;
      const reqInit = { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) };
      const res1 = await fetch(urlPrimary, reqInit);
      if (res1.ok) return;
      const res2 = await fetch(urlFallback, reqInit);
      if (!res2.ok) throw new Error(await res2.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
      setGeminiApiKey("");
      toast({ title: "Paramètres IA enregistrés" });
    },
    onError: async (e: any) => {
      toast({ title: "Erreur", description: (await e?.message) || "Impossible d'enregistrer", variant: "destructive" });
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (target: { email: string; role: string }) => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
      const res = await fetch(`${apiBase}/api/admin/roles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(target)
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      toast({ title: "Rôle retiré" });
      queryClient.invalidateQueries({ queryKey: ["roles-list"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Erreur", description: message || "Impossible de retirer le rôle", variant: 'destructive' });
    }
  });

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres Système</h1>
        <p className="text-muted-foreground mt-2">
          Gestion des rôles et configuration globale
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Gestion des Rôles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="email">Email utilisateur</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" placeholder="utilisateur@exemple.com" />
            </div>
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="ambassador">Ambassadeur</SelectItem>
                  <SelectItem value="user">Utilisateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => assignRoleMutation.mutate()} disabled={assignRoleMutation.isPending || !email}>
            {assignRoleMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Attribution...
              </>
            ) : (
              <>Attribuer le rôle</>
            )}
          </Button>

          <div className="rounded-md border p-4">
            <p className="font-medium mb-3">Rôles existants</p>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement...</div>
            ) : (
              <div className="space-y-2">
                {(roles || []).length === 0 ? (
                  <p className="text-muted-foreground">Aucun rôle configuré</p>
                ) : (
                  (roles || []).map((r: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border rounded-md p-2">
                      <div className="text-sm">
                        <span className="font-medium">{r.email || r.user_id}</span>
                        <span className="ml-2 text-muted-foreground">{r.role}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeRoleMutation.mutate({ email: r.email, role: r.role })}>
                        Retirer
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Configuration IA (Gemini)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Switch checked={geminiEnabled} onCheckedChange={(v) => setGeminiEnabled(v)} />
              <div>
                <p className="font-medium">Activer Gemini</p>
                <p className="text-sm text-muted-foreground">Utiliser Gemini pour extraction et réécriture</p>
              </div>
            </div>
            <div>
              <Label>Modèle</Label>
              <Select value={geminiModel} onValueChange={setGeminiModel}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-1.5-flash">gemini-1.5-flash (gratuit)</SelectItem>
                  <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                  <SelectItem value="gemini-1.0-pro">gemini-1.0-pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Température</Label>
              <Input value={geminiTemperature} onChange={(e) => setGeminiTemperature(e.target.value)} placeholder="0.2" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Prompt par défaut pour le titre</Label>
              <Textarea
                value={defaultTitlePrompt}
                onChange={(e) => setDefaultTitlePrompt(e.target.value)}
                rows={3}
                placeholder="Ex: Mettre en avant la promesse principale, max 10 mots."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Prompt par défaut pour la description</Label>
              <Textarea
                value={defaultDescriptionPrompt}
                onChange={(e) => setDefaultDescriptionPrompt(e.target.value)}
                rows={4}
                placeholder="Ex: Accroche + 5–7 puces orientées bénéfices (•), éviter jargon."
                className="mt-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Clé API Gemini</Label>
              <Input type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} placeholder={geminiMasked ? `**** ${geminiMasked}` : "sk-..."} />
              <p className="text-xs text-muted-foreground mt-1">Saisir pour mettre à jour. La valeur actuelle n'est pas affichée.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveAiMutation.mutate()} disabled={saveAiMutation.isPending || aiLoading}>
              {saveAiMutation.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</>) : ("Enregistrer")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
