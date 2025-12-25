import { Gift, Smartphone, BadgeIndianRupee, ShoppingCart } from 'lucide-react';

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const suggestions = [
  {
    icon: Gift,
    label: 'Help me find a gift',
    prompt: 'Help me find a gift for someone special. I need ideas and recommendations.',
  },
  {
    icon: Smartphone,
    label: 'Compare products',
    prompt: 'I want to compare some products. Can you help me understand the differences?',
  },
  {
    icon: BadgeIndianRupee,
    label: 'Is this a good deal?',
    prompt: 'I found a product and want to know if the price is good. Can you analyze it?',
  },
  {
    icon: ShoppingCart,
    label: 'Add to my board',
    prompt: 'I want to track a product and add it to my board for later.',
  },
];

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-serif italic mb-3">ProductGPT</h1>
        <p className="text-muted-foreground text-lg">
          Your calm assistant for smarter purchases
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-foreground/20 hover:bg-muted/50 transition-colors text-left group"
          >
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-background transition-colors">
              <suggestion.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">{suggestion.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
