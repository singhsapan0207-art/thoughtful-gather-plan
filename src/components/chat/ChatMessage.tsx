import { User } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    products?: Array<{
      id?: string;
      name: string;
      image_url?: string;
      current_price?: number;
      currency?: string;
      summary?: string;
      url?: string;
    }>;
  };
  created_at: string;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const products = message.metadata?.products || [];

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-secondary' : 'bg-primary'
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-secondary-foreground" />
        ) : (
          <span className="text-xs font-medium text-primary-foreground">AI</span>
        )}
      </div>
      
      <div className={`flex-1 space-y-3 ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block max-w-full ${isUser ? 'text-left' : ''}`}>
          <div className={`rounded-2xl px-4 py-2.5 ${
            isUser 
              ? 'bg-primary text-primary-foreground ml-auto' 
              : 'bg-muted text-foreground'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>

        {products.length > 0 && (
          <div className="space-y-2 mt-3">
            {products.map((product, index) => (
              <ProductCard key={index} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
