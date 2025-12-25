import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/hooks/useProducts';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BoardInsightsProps {
  products: Product[];
  boardId: string;
}

export default function BoardInsights({ products, boardId }: BoardInsightsProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateInsight = async () => {
    if (products.length === 0) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-board-insight', {
        body: {
          products: products.map((p) => ({
            name: p.name,
            price: p.current_price,
            note: p.note,
          })),
        },
      });

      if (error) throw error;
      
      if (data.error) {
        if (data.error.includes('429')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (data.error.includes('402')) {
          toast.error('AI credits exhausted. Please add more credits.');
        } else {
          toast.error(data.error);
        }
        return;
      }
      
      setInsight(data.insight);
    } catch (error: any) {
      console.error('Insight error:', error);
      if (error.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('402')) {
        toast.error('AI credits exhausted. Please add more credits.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (products.length > 0 && !insight) {
      generateInsight();
    }
  }, [products.length]);

  if (products.length === 0) return null;

  return (
    <div className="mb-8 p-5 border border-border rounded-lg bg-muted/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">AI Insight</p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Analyzing your board...</p>
            ) : insight ? (
              <p className="text-sm text-muted-foreground">{insight}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {products.length} product{products.length !== 1 ? 's' : ''} in this board
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={generateInsight}
          disabled={isLoading}
          className="flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
