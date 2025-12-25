import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Board {
  id: string;
  user_id: string;
  name: string;
  note: string | null;
  share_token: string | null;
  is_public: boolean;
  allow_comments: boolean;
  created_at: string;
  updated_at: string;
}

export function useBoards() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['boards', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Board[];
    },
    enabled: !!user,
  });
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (error) throw error;
      return data as Board;
    },
    enabled: !!boardId,
  });
}

export function useBoardByShareToken(shareToken: string) {
  return useQuery({
    queryKey: ['board-shared', shareToken],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_public', true)
        .single();

      if (error) throw error;
      return data as Board;
    },
    enabled: !!shareToken,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, note }: { name: string; note?: string }) => {
      const { data, error } = await supabase
        .from('boards')
        .insert({
          name,
          note: note || null,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Board created');
    },
    onError: (error) => {
      toast.error('Failed to create board: ' + error.message);
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, note }: { id: string; name: string; note?: string }) => {
      const { data, error } = await supabase
        .from('boards')
        .update({ name, note: note || null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board', data.id] });
      toast.success('Board updated');
    },
    onError: (error) => {
      toast.error('Failed to update board: ' + error.message);
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Board deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete board: ' + error.message);
    },
  });
}

export function useToggleBoardSharing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, isPublic }: { boardId: string; isPublic: boolean }) => {
      const shareToken = isPublic ? crypto.randomUUID().slice(0, 8) : null;
      
      const { data, error } = await supabase
        .from('boards')
        .update({ 
          is_public: isPublic, 
          share_token: shareToken 
        })
        .eq('id', boardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board', data.id] });
      toast.success(data.is_public ? 'Board is now shareable' : 'Board is now private');
    },
    onError: (error) => {
      toast.error('Failed to update sharing: ' + error.message);
    },
  });
}
