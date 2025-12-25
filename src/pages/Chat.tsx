import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { useConversation, useCreateConversation } from '@/hooks/useConversations';

export default function Chat() {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const { data: conversation, isLoading, error } = useConversation(conversationId);
  const createConversation = useCreateConversation();

  // If no conversation ID, create a new one
  useEffect(() => {
    if (!conversationId && !createConversation.isPending) {
      createConversation.mutateAsync({ title: 'New conversation' }).then((newConv) => {
        navigate(`/chat/${newConv.id}`, { replace: true });
      });
    }
  }, [conversationId]);

  // If conversation not found, redirect to new chat
  useEffect(() => {
    if (error && conversationId) {
      navigate('/chat', { replace: true });
    }
  }, [error, conversationId, navigate]);

  return (
    <ChatLayout>
      <ChatContainer conversationId={conversationId} />
    </ChatLayout>
  );
}
