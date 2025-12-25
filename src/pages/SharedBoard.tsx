import { useParams, Link } from 'react-router-dom';
import { useBoardByShareToken } from '@/hooks/useBoards';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import BoardInsights from '@/components/BoardInsights';

export default function SharedBoard() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { data: board, isLoading: boardLoading, error } = useBoardByShareToken(shareToken!);
  const { data: products, isLoading: productsLoading } = useProducts(board?.id || '');

  if (boardLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="editorial-container py-12">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-serif mb-2">Board not found</h2>
          <p className="text-muted-foreground mb-4">
            This board may be private or doesn't exist
          </p>
          <Link to="/">
            <Button variant="outline">Go home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getPriceTrend = (product: typeof products extends (infer T)[] | undefined ? T : never) => {
    if (!product.product_links || product.product_links.length === 0) return 'stable';
    const link = product.product_links[0];
    if (!link.current_price || !product.current_price) return 'stable';
    if (link.current_price < product.current_price) return 'down';
    if (link.current_price > product.current_price) return 'up';
    return 'stable';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="editorial-container py-6">
          <p className="text-sm text-muted-foreground mb-4">Shared Board</p>
          <h1 className="text-3xl font-serif">{board.name}</h1>
          {board.note && (
            <p className="text-muted-foreground mt-2">{board.note}</p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="editorial-container py-8">
        {/* AI Insights */}
        {products && products.length > 0 && (
          <BoardInsights products={products} boardId={board.id} />
        )}

        {/* Products List */}
        {productsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No products in this board</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products?.map((product, index) => {
              const trend = getPriceTrend(product);
              const bestPrice = product.product_links?.reduce((min, link) => {
                if (!link.current_price) return min;
                return link.current_price < min ? link.current_price : min;
              }, Infinity);

              return (
                <div
                  key={product.id}
                  className="border border-border rounded-lg p-5 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex gap-5">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded bg-muted flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      
                      <div className="flex items-center gap-3 mt-2">
                        {product.current_price && (
                          <span className="text-lg font-medium">
                            ₹{product.current_price.toLocaleString()}
                          </span>
                        )}
                        {trend !== 'stable' && (
                          <span className={`flex items-center gap-1 text-sm ${
                            trend === 'down' ? 'text-success' : 'text-destructive'
                          }`}>
                            {trend === 'down' ? (
                              <TrendingDown className="h-4 w-4" />
                            ) : (
                              <TrendingUp className="h-4 w-4" />
                            )}
                          </span>
                        )}
                        {bestPrice && bestPrice !== Infinity && bestPrice !== product.current_price && (
                          <span className="text-sm text-muted-foreground">
                            Best: ₹{bestPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {product.ai_note && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {product.ai_note}
                        </p>
                      )}

                      {product.product_links && product.product_links.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          {product.product_links.slice(0, 3).map((link) => (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted px-2 py-1 rounded"
                            >
                              {link.retailer || 'Link'}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center border-t border-border pt-12">
          <p className="text-muted-foreground mb-4">
            Want to create your own boards?
          </p>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
