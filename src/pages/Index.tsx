import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare, TrendingDown, Share2, Sparkles } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (user) {
    navigate('/chat');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="editorial-container pt-16 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-serif italic mb-6 animate-fade-in">
            ProductGPT
          </h1>
          <p className="text-xl text-muted-foreground mb-10 animate-fade-in" style={{ animationDelay: '100ms' }}>
            Your calm AI assistant for smarter purchases. Ask anything, compare products, and buy with intention.
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="border-t border-border py-20">
        <div className="editorial-container">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <MessageSquare className="h-8 w-8" />
              <h3 className="text-xl font-serif">Chat-First Experience</h3>
              <p className="text-muted-foreground">
                Just ask. Get product insights, comparisons, and recommendations through natural conversation.
              </p>
            </div>

            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <Sparkles className="h-8 w-8" />
              <h3 className="text-xl font-serif">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">
                Understand products deeply. Get honest summaries, spot potential issues, and make informed decisions.
              </p>
            </div>

            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <TrendingDown className="h-8 w-8" />
              <h3 className="text-xl font-serif">Track Price History</h3>
              <p className="text-muted-foreground">
                See how prices change over time. Know when you're getting a good deal and when to wait.
              </p>
            </div>

            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
              <Share2 className="h-8 w-8" />
              <h3 className="text-xl font-serif">Organize with Boards</h3>
              <p className="text-muted-foreground">
                Save products to boards. Perfect for gift planning, wishlists, or tracking big purchases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20">
        <div className="editorial-container text-center">
          <h2 className="text-3xl font-serif mb-4">Think before you buy</h2>
          <p className="text-muted-foreground mb-8">
            Start a conversation about the products you care about
          </p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            Start Chatting
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="editorial-container text-center text-sm text-muted-foreground">
          <p>ProductGPT — Intentional Shopping</p>
        </div>
      </footer>
    </div>
  );
}
