import { ExternalLink, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Product {
  id?: string;
  name: string;
  image_url?: string;
  current_price?: number;
  currency?: string;
  summary?: string;
  url?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToBoard?: (product: Product) => void;
}

export function ProductCard({ product, onAddToBoard }: ProductCardProps) {
  const formatPrice = (price: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="border border-border rounded-xl p-4 bg-card hover:border-foreground/20 transition-colors">
      <div className="flex gap-4">
        {product.image_url && (
          <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{product.name}</h4>
          
          {product.current_price && (
            <p className="text-lg font-semibold mt-1">
              {formatPrice(product.current_price, product.currency)}
            </p>
          )}
          
          {product.summary && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {product.summary}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {product.url && (
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" asChild>
            <a href={product.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              View
            </a>
          </Button>
        )}
        {onAddToBoard && (
          <Button size="sm" variant="secondary" className="flex-1 gap-1.5" onClick={() => onAddToBoard(product)}>
            <Plus className="h-3.5 w-3.5" />
            Add to Board
          </Button>
        )}
      </div>
    </div>
  );
}
