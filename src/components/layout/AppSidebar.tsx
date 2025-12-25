import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversation } from '@/hooks/useConversations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  Plus, 
  MessageSquare, 
  LayoutGrid, 
  TrendingUp, 
  Settings, 
  LogOut,
  MoreHorizontal,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  User
} from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, subDays, isAfter } from 'date-fns';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

function groupConversations(conversations: Conversation[]) {
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const lastWeek: Conversation[] = [];
  const older: Conversation[] = [];

  const sevenDaysAgo = subDays(new Date(), 7);

  conversations.forEach((conv) => {
    const date = new Date(conv.updated_at);
    if (isToday(date)) {
      today.push(conv);
    } else if (isYesterday(date)) {
      yesterday.push(conv);
    } else if (isAfter(date, sevenDaysAgo)) {
      lastWeek.push(conv);
    } else {
      older.push(conv);
    }
  });

  return { today, yesterday, lastWeek, older };
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  
  const { data: conversations = [] } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateConversation = useUpdateConversation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const grouped = groupConversations(conversations);

  const handleNewChat = async () => {
    const newConv = await createConversation.mutateAsync({ title: 'New conversation' });
    navigate(`/chat/${newConv.id}`);
  };

  const handleRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async () => {
    if (editingId && editTitle.trim()) {
      await updateConversation.mutateAsync({ id: editingId, title: editTitle.trim() });
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (id: string) => {
    await deleteConversation.mutateAsync(id);
    if (location.pathname === `/chat/${id}`) {
      navigate('/chat');
    }
  };

  const renderConversationItem = (conv: Conversation) => {
    const isActive = location.pathname === `/chat/${conv.id}`;
    const isEditing = editingId === conv.id;

    return (
      <SidebarMenuItem key={conv.id}>
        <div 
          className={`group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
            isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'
          }`}
        >
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-6 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') handleCancelRename();
                }}
              />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveRename}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelRename}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <Link to={`/chat/${conv.id}`} className="flex-1 truncate">
                <MessageSquare className="h-3.5 w-3.5 inline mr-2 opacity-60" />
                {conv.title}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleRename(conv)}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(conv.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </SidebarMenuItem>
    );
  };

  const renderConversationGroup = (label: string, convs: Conversation[]) => {
    if (convs.length === 0) return null;
    return (
      <SidebarGroup key={label}>
        <SidebarGroupLabel className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {convs.map(renderConversationItem)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <Link to="/chat" className="flex items-center gap-2">
            <h1 className="text-lg font-serif italic text-sidebar-foreground">ProductGPT</h1>
          </Link>
          <SidebarTrigger className="h-8 w-8" />
        </div>
        <Button 
          onClick={handleNewChat} 
          className="w-full mt-3 gap-2" 
          variant="outline"
          disabled={createConversation.isPending}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && 'New Chat'}
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1">
          {renderConversationGroup('Today', grouped.today)}
          {renderConversationGroup('Yesterday', grouped.yesterday)}
          {renderConversationGroup('Previous 7 Days', grouped.lastWeek)}
          {renderConversationGroup('Older', grouped.older)}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link 
                to="/boards" 
                className={location.pathname === '/boards' || location.pathname.startsWith('/board/') ? 'bg-sidebar-accent' : ''}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Boards</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link 
                to="/settings"
                className={location.pathname === '/settings' ? 'bg-sidebar-accent' : ''}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-2 pt-2 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 h-10">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="flex-1 text-left truncate text-sm">
                  {user?.email?.split('@')[0]}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {user?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
