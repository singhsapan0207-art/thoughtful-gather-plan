import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCreateProduct, useAddProductLink } from '@/hooks/useProducts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

export default function AddProductDialog({ open, onOpenChange, boardId }: AddProductDialogProps) {
  const { user } = useAuth();
  const createProduct = useCreateProduct();
  const addProductLink = useAddProductLink();

  const [activeTab, setActiveTab] = useState<'link' | 'manual'>('link');
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Manual form
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');

  const resetForm = () => {
    setUrl('');
    setName('');
    setImageUrl('');
    setPrice('');
    setNote('');
    setIsExtracting(false);
  };

  const handleExtractFromLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsExtracting(true);

    try {
      const { data, error } = await supabase.functions.invoke('extract-product', {
        body: { url: url.trim() },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Create product
      const product = await createProduct.mutateAsync({
        board_id: boardId,
        name: data.name || 'Unknown Product',
        image_url: data.image_url,
        current_price: data.price,
        currency: data.currency || 'INR',
      });

      // Add the link
      await addProductLink.mutateAsync({
        product_id: product.id,
        url: url.trim(),
        retailer: data.retailer,
        current_price: data.price,
        currency: data.currency || 'INR',
      });

      // Generate AI note
      try {
        await supabase.functions.invoke('generate-product-note', {
          body: { productId: product.id },
        });
      } catch (e) {
        // Non-critical, ignore
      }

      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Extract error:', error);
      if (error.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('402')) {
        toast.error('AI credits exhausted. Please add more credits.');
      } else {
        toast.error('Failed to extract product. Try manual entry.');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createProduct.mutateAsync({
        board_id: boardId,
        name: name.trim(),
        image_url: imageUrl.trim() || undefined,
        current_price: price ? parseFloat(price) : undefined,
        note: note.trim() || undefined,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Add Product</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'link' | 'manual')} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="gap-2">
              <Sparkles className="h-4 w-4" />
              From Link
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="mt-4">
            <form onSubmit={handleExtractFromLink} className="space-y-4">
              <div className="space-y-2">
                <Label>Product URL</Label>
                <Input
                  placeholder="https://amazon.in/product..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Paste any product link — we'll extract the details using AI
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isExtracting || !url.trim()}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Extract Product
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input
                  placeholder="Sony WH-1000XM5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="29990"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                  placeholder="Your notes..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createProduct.isPending || !name.trim()}
              >
                {createProduct.isPending ? 'Adding...' : 'Add Product'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
