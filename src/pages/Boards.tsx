import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBoards, useCreateBoard, useDeleteBoard } from '@/hooks/useBoards';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Boards() {
  const { data: boards, isLoading } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardNote, setNewBoardNote] = useState('');

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    await createBoard.mutateAsync({
      name: newBoardName.trim(),
      note: newBoardNote.trim() || undefined,
    });

    setNewBoardName('');
    setNewBoardNote('');
    setIsCreateOpen(false);
  };

  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-serif">Your Boards</h2>
              <p className="text-muted-foreground mt-1">
                Organize your purchase intentions
              </p>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Board
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">Create Board</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateBoard} className="space-y-4 mt-4">
                  <div>
                    <Input
                      placeholder="Board name"
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      className="h-11"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Note (optional)"
                      value={newBoardNote}
                      onChange={(e) => setNewBoardNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createBoard.isPending}>
                    {createBoard.isPending ? 'Creating...' : 'Create Board'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : boards?.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">No boards yet</p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                Create your first board
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {boards?.map((board, index) => (
                <div
                  key={board.id}
                  className="group border border-border rounded-lg p-5 hover:border-foreground/20 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <Link to={`/board/${board.id}`} className="flex-1">
                      <h3 className="text-lg font-medium">{board.name}</h3>
                      {board.note && (
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
                          {board.note}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        Created {formatDistanceToNow(new Date(board.created_at), { addSuffix: true })}
                      </p>
                    </Link>

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
                        <DropdownMenuItem
                          onClick={() => deleteBoard.mutate(board.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ChatLayout>
  );
}
