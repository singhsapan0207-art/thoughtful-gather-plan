import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ProductLink {
  id: string;
  product_id: string;
  url: string;
  retailer: string | null;
  current_price: number | null;
  currency: string;
  last_checked_at: string | null;
  created_at: string;
}

export interface PriceHistory {
  id: string;
  product_link_id: string;
  price: number;
  currency: string;
  recorded_at: string;
}

export interface Product {
  id: string;
  board_id: string;
  user_id: string;
  name: string;
  image_url: string | null;
  note: string | null;
  ai_note: string | null;
  current_price: number | null;
  currency: string;
  price_alert_enabled: boolean;
  target_price: number | null;
  created_at: string;
  updated_at: string;
  product_links?: ProductLink[];
}

export function useProducts(boardId: string) {
  return useQuery({
    queryKey: ['products', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_links (*)
        `)
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!boardId,
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_links (*)
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
  });
}

export function usePriceHistory(productLinkId: string) {
  return useQuery({
    queryKey: ['price-history', productLinkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('product_link_id', productLinkId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      return data as PriceHistory[];
    },
    enabled: !!productLinkId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (product: {
      board_id: string;
      name: string;
      image_url?: string;
      note?: string;
      current_price?: number;
      currency?: string;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products', data.board_id] });
      toast.success('Product added');
    },
    onError: (error) => {
      toast.error('Failed to add product: ' + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products', data.board_id] });
      queryClient.invalidateQueries({ queryKey: ['product', data.id] });
    },
    onError: (error) => {
      toast.error('Failed to update product: ' + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, boardId }: { productId: string; boardId: string }) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return { boardId };
    },
    onSuccess: ({ boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['products', boardId] });
      toast.success('Product removed');
    },
    onError: (error) => {
      toast.error('Failed to remove product: ' + error.message);
    },
  });
}

export function useAddProductLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (link: {
      product_id: string;
      url: string;
      retailer?: string;
      current_price?: number;
      currency?: string;
    }) => {
      const { data, error } = await supabase
        .from('product_links')
        .insert(link)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product', data.product_id] });
      toast.success('Link added');
    },
    onError: (error) => {
      toast.error('Failed to add link: ' + error.message);
    },
  });
}

export function useMoveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, fromBoardId, toBoardId }: { 
      productId: string; 
      fromBoardId: string; 
      toBoardId: string 
    }) => {
      const { error } = await supabase
        .from('products')
        .update({ board_id: toBoardId })
        .eq('id', productId);

      if (error) throw error;
      return { fromBoardId, toBoardId };
    },
    onSuccess: ({ fromBoardId, toBoardId }) => {
      queryClient.invalidateQueries({ queryKey: ['products', fromBoardId] });
      queryClient.invalidateQueries({ queryKey: ['products', toBoardId] });
      toast.success('Product moved');
    },
    onError: (error) => {
      toast.error('Failed to move product: ' + error.message);
    },
  });
}
