import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBoard, useUpdateBoard, useToggleBoardSharing } from '@/hooks/useBoards';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, MoreHorizontal, Trash2, Edit, Share2, Copy, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import AddProductDialog from '@/components/AddProductDialog';
import ProductPriceChart from '@/components/ProductPriceChart';
import BoardInsights from '@/components/BoardInsights';

export default function BoardDetail() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: board, isLoading: boardLoading } = useBoard(boardId!);
  const { data: products, isLoading: productsLoading } = useProducts(boardId!);
  const updateBoard = useUpdateBoard();
  const toggleSharing = useToggleBoardSharing();
  const deleteProduct = useDeleteProduct();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');

  const isOwner = board?.user_id === user?.id;

  const openEdit = () => {
    if (board) {
      setEditName(board.name);
      setEditNote(board.note || '');
      setIsEditOpen(true);
    }
  };

  const handleUpdateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardId || !editName.trim()) return;

    await updateBoard.mutateAsync({
      id: boardId,
      name: editName.trim(),
      note: editNote.trim() || undefined,
    });
    setIsEditOpen(false);
  };

  const copyShareLink = () => {
    if (board?.share_token) {
      const url = `${window.location.origin}/shared/${board.share_token}`;
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const getPriceTrend = (product: typeof products extends (infer T)[] | undefined ? T : never) => {
    if (!product.product_links || product.product_links.length === 0) return 'stable';
    const link = product.product_links[0];
    if (!link.current_price || !product.current_price) return 'stable';
    if (link.current_price < product.current_price) return 'down';
    if (link.current_price > product.current_price) return 'up';
    return 'stable';
  };

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

  if (!board) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-serif mb-2">Board not found</h2>
          <Button variant="outline" onClick={() => navigate('/')}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="editorial-container py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            All Boards
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-serif">{board.name}</h1>
              {board.note && (
                <p className="text-muted-foreground mt-2">{board.note}</p>
              )}
            </div>

            {isOwner && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setIsShareOpen(true)}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={openEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="editorial-container py-8">
        {/* AI Insights */}
        {products && products.length > 0 && (
          <BoardInsights products={products} boardId={boardId!} />
        )}

        {/* Add Product Button */}
        {isOwner && (
          <div className="mb-8">
            <Button onClick={() => setIsAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
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
            <p className="text-muted-foreground mb-4">No products in this board</p>
            {isOwner && (
              <Button onClick={() => setIsAddOpen(true)} variant="outline">
                Add your first product
              </Button>
            )}
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
                  className="group border border-border rounded-lg p-5 hover:border-foreground/20 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex gap-5">
                    {/* Product Image */}
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded bg-muted flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded flex-shrink-0" />
                    )}

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium truncate">{product.name}</h3>
                          
                          {/* Price Display */}
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

                          {/* AI Note */}
                          {product.ai_note && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                              {product.ai_note}
                            </p>
                          )}

                          {/* User Note */}
                          {product.note && (
                            <p className="text-sm text-muted-foreground/70 mt-1 line-clamp-1 italic">
                              {product.note}
                            </p>
                          )}

                          {/* Retailer Links */}
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

                        {/* Actions */}
                        {isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedProductId(product.id)}>
                                View Price History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteProduct.mutate({ productId: product.id, boardId: boardId! })}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Product Dialog */}
      <AddProductDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        boardId={boardId!}
      />

      {/* Edit Board Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Edit Board</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateBoard} className="space-y-4 mt-4">
            <div>
              <Input
                placeholder="Board name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <Textarea
                placeholder="Note (optional)"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={updateBoard.isPending}>
              {updateBoard.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Share Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Make board public</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone with the link can view
                </p>
              </div>
              <Switch
                checked={board.is_public}
                onCheckedChange={(checked) => 
                  toggleSharing.mutate({ boardId: boardId!, isPublic: checked })
                }
              />
            </div>

            {board.is_public && board.share_token && (
              <div className="space-y-2">
                <Label>Share link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/shared/${board.share_token}`}
                    className="h-10"
                  />
                  <Button variant="outline" size="icon" onClick={copyShareLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Price History Dialog */}
      <Dialog open={!!selectedProductId} onOpenChange={() => setSelectedProductId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Price History</DialogTitle>
          </DialogHeader>
          {selectedProductId && (
            <ProductPriceChart productId={selectedProductId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
