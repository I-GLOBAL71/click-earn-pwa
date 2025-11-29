import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Sparkles, X, Star, Trash2, ArrowLeft } from "lucide-react";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImageData {
  url: string;
  isMain: boolean;
}

export const AdminProductImport = () => {
  const [alibabaUrl, setAlibabaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [rewritingTitle, setRewritingTitle] = useState(false);
  const [rewritingDesc, setRewritingDesc] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    commission_type: "percentage",
    commission_value: "",
    stock_quantity: "0",
  });

  const handleExtract = async () => {
    if (!alibabaUrl.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une URL Alibaba",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
      const resp = await fetch(`${apiBase}/api/import-alibaba-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: alibabaUrl })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || "Impossible d'extraire les données");
      }
      const data = await resp.json();
      setProductData(data);
      setFormData({
        name: data.title || "",
        description: data.description || "",
        price: data.price || "",
        category: "",
        commission_type: "percentage",
        commission_value: "10",
        stock_quantity: "0",
      });

      // Préparer les images
      const allImages: ImageData[] = [];
      if (data.mainImage) {
        allImages.push({ url: data.mainImage, isMain: true });
      }
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((img: string) => {
          if (img !== data.mainImage) {
            allImages.push({ url: img, isMain: false });
          }
        });
      }
      setImages(allImages);
      setMainImageIndex(0);

      toast({
        title: "Extraction réussie",
        description: "Les données du produit ont été extraites",
      });
    } catch (error: unknown) {
      toast({
        title: "Erreur d'extraction",
        description: (error instanceof Error ? error.message : String(error)) || "Impossible d'extraire les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRewriteTitleWithAI = async () => {
    if (!formData.name || !formData.description) {
      toast({ title: "Erreur", description: "Le titre et la description sont requis", variant: "destructive" });
      return;
    }
    setRewritingTitle(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
      const resp = await fetch(`${apiBase}/api/rewrite-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.name,
          productDescription: formData.description,
          language: 'fr'
        })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || 'Impossible de réécrire le nom');
      }
      const data = await resp.json();
      setFormData({ ...formData, name: data.rewrittenTitle });
      const via = data.aiUsed ? "IA (Gemini)" : "mécanisme de secours";
      toast({ title: "Réécriture réussie", description: `Nom amélioré via ${via}` });
    } catch (error: unknown) {
      toast({ title: "Erreur de réécriture", description: (error instanceof Error ? error.message : String(error)) || "Impossible de réécrire le nom", variant: "destructive" });
    } finally {
      setRewritingTitle(false);
    }
  };

  const handleRewriteDescriptionWithAI = async () => {
    if (!formData.name || !formData.description) {
      toast({ title: "Erreur", description: "Le titre et la description sont requis", variant: "destructive" });
      return;
    }
    setRewritingDesc(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
      const resp = await fetch(`${apiBase}/api/rewrite-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.name,
          productDescription: formData.description,
          language: 'fr'
        })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || 'Impossible de réécrire la description');
      }
      const data = await resp.json();
      setFormData({ ...formData, description: data.rewrittenDescription });
      const via = data.aiUsed ? "IA (Gemini)" : "mécanisme de secours";
      toast({ title: "Réécriture réussie", description: `Description améliorée via ${via}` });
    } catch (error: unknown) {
      toast({ title: "Erreur de réécriture", description: (error instanceof Error ? error.message : String(error)) || "Impossible de réécrire la description", variant: "destructive" });
    } finally {
      setRewritingDesc(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (mainImageIndex === index && newImages.length > 0) {
      setMainImageIndex(0);
    } else if (mainImageIndex > index) {
      setMainImageIndex(mainImageIndex - 1);
    }
  };

  const handleSetMainImage = (index: number) => {
    setMainImageIndex(index);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: images[mainImageIndex]?.url || null,
        category: formData.category,
        commission_type: formData.commission_type,
        commission_value: parseFloat(formData.commission_value),
        stock_quantity: parseInt(formData.stock_quantity),
        is_active: true,
        images: images.map((i) => i.url),
      };

      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://click-earn-pwa.vercel.app' : '');
      const resp = await fetch(`${apiBase}/api/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(productData),
      });
      if (!resp.ok) throw new Error(await resp.text());

      toast({
        title: "Produit créé",
        description: "Le produit a été importé avec succès",
      });

      navigate('/admin/products');
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/products')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Importer depuis Alibaba</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Importez et améliorez vos produits avec l'IA
          </p>
        </div>
      </div>

      {/* Étape 1: URL Alibaba */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Étape 1: URL du produit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="url">URL Alibaba</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="url"
                placeholder="https://www.alibaba.com/product-detail/..."
                value={alibabaUrl}
                onChange={(e) => setAlibabaUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleExtract} disabled={loading} className="shrink-0">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extraction...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Extraire
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Étape 2: Gestion des images */}
      {images.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Étape 2: Gestion des images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    mainImageIndex === index ? 'border-primary shadow-elegant' : 'border-border'
                  }`}>
                    <img
                      src={image.url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {mainImageIndex === index ? (
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Star className="h-4 w-4 fill-current" />
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleSetMainImage(index)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {mainImageIndex === index && (
                    <p className="text-xs text-center mt-1 font-medium text-primary">
                      Image principale
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3: Informations du produit */}
      {productData && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Étape 3: Informations du produit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRewriteTitleWithAI}
                  disabled={rewritingTitle}
                >
                  {rewritingTitle ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Réécriture...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-2" />
                      Améliorer le nom
                    </>
                  )}
                </Button>
              </div>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2"
              />
              
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="description">Description</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRewriteDescriptionWithAI}
                  disabled={rewritingDesc}
                >
                  {rewritingDesc ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Réécriture...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-2" />
                      Améliorer la description
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="resize-none"
              />
              
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Prix (FCFA) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Électronique, Mode, etc."
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="commission_type">Type de commission *</Label>
                <Select
                  value={formData.commission_type}
                  onValueChange={(value) => setFormData({ ...formData, commission_type: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe (FCFA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="commission_value">Valeur de commission *</Label>
                <Input
                  id="commission_value"
                  type="number"
                  step="0.01"
                  value={formData.commission_value}
                  onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button onClick={handleSaveProduct} className="flex-1">
                Sauvegarder le produit
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/products')}
                className="flex-1 sm:flex-none"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
