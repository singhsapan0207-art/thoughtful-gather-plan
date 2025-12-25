import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRight, Package, TrendingDown, Share2, Bell } from 'lucide-react';

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
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="editorial-container pt-16 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-serif italic mb-6 animate-fade-in">
            ProductBoards
          </h1>
          <p className="text-xl text-muted-foreground mb-10 animate-fade-in" style={{ animationDelay: '100ms' }}>
            A calm space to plan your purchases. Track prices, compare retailers, and buy with intention.
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
              <Package className="h-8 w-8" />
              <h3 className="text-xl font-serif">Organize Intentionally</h3>
              <p className="text-muted-foreground">
                Create boards for different needs — holiday gifts, home office, wishlist. Add products from any retailer with a simple link.
              </p>
            </div>

            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <TrendingDown className="h-8 w-8" />
              <h3 className="text-xl font-serif">Track Price History</h3>
              <p className="text-muted-foreground">
                See how prices change over time. Know when you're getting a good deal and when to wait for a better price.
              </p>
            </div>

            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <Bell className="h-8 w-8" />
              <h3 className="text-xl font-serif">Smart Alerts</h3>
              <p className="text-muted-foreground">
                Get notified when prices drop. Set your target price and we'll tell you when it's time to buy.
              </p>
            </div>

            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
              <Share2 className="h-8 w-8" />
              <h3 className="text-xl font-serif">Share with Anyone</h3>
              <p className="text-muted-foreground">
                Share your boards with family and friends. Perfect for gift planning or getting input on big purchases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20">
        <div className="editorial-container text-center">
          <h2 className="text-3xl font-serif mb-4">Buy with intention</h2>
          <p className="text-muted-foreground mb-8">
            Start tracking the products you care about
          </p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            Create Your First Board
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="editorial-container text-center text-sm text-muted-foreground">
          <p>ProductBoards — Intentional Shopping</p>
        </div>
      </footer>
    </div>
  );
}
