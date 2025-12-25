import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface AlertPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  price_drop_threshold: number;
}

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['alert-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as AlertPreferences | null;
    },
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<AlertPreferences>) => {
      if (preferences) {
        const { error } = await supabase
          .from('alert_preferences')
          .update(updates)
          .eq('id', preferences.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('alert_preferences')
          .insert({
            user_id: user!.id,
            ...updates,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-preferences'] });
      toast.success('Settings saved');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });

  const [threshold, setThreshold] = useState(preferences?.price_drop_threshold || 15);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="editorial-container py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Boards
          </Link>
          <h1 className="text-3xl font-serif">Settings</h1>
        </div>
      </header>

      <main className="editorial-container py-8">
        <div className="max-w-md space-y-8">
          {/* Email Alerts Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Email Alerts</h2>
            
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <Label>Price drop notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when prices drop significantly
                </p>
              </div>
              <Switch
                checked={preferences?.email_enabled ?? true}
                onCheckedChange={(checked) => 
                  updatePreferences.mutate({ email_enabled: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Alert threshold (%)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Notify me when price drops by at least this percentage
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value) || 15)}
                  className="w-24"
                />
                <Button
                  variant="outline"
                  onClick={() => updatePreferences.mutate({ price_drop_threshold: threshold })}
                  disabled={updatePreferences.isPending}
                >
                  Save
                </Button>
              </div>
            </div>
          </section>

          {/* Account Section */}
          <section className="space-y-4 pt-8 border-t border-border">
            <h2 className="text-lg font-medium">Account</h2>
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
