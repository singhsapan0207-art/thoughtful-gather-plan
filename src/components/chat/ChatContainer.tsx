import { useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';
import { useMessages, useSendMessage } from '@/hooks/useMessages';

interface ChatContainerProps {
  conversationId?: string;
}

export function ChatContainer({ conversationId }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: messages = [], isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (content: string, imageUrl?: string) => {
    if (!conversationId) return;
    await sendMessage.mutateAsync({ conversationId, content, imageUrl });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : hasMessages ? (
          <MessageList messages={messages} isLoading={sendMessage.isPending} />
        ) : (
          <WelcomeScreen onSuggestionClick={handleSend} />
        )}
      </div>
      
      <ChatInput 
        onSend={handleSend} 
        disabled={!conversationId || sendMessage.isPending} 
        isLoading={sendMessage.isPending}
      />
    </div>
  );
}
