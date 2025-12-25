-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger for new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Boards table
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  note TEXT,
  share_token TEXT UNIQUE,
  is_public BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own boards" ON public.boards
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own boards" ON public.boards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boards" ON public.boards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own boards" ON public.boards
  FOR DELETE USING (auth.uid() = user_id);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  note TEXT,
  ai_note TEXT,
  current_price NUMERIC(10,2),
  currency TEXT DEFAULT 'INR',
  price_alert_enabled BOOLEAN DEFAULT false,
  target_price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products in own or public boards" ON public.products
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.boards WHERE boards.id = products.board_id AND boards.is_public = true)
  );

CREATE POLICY "Users can insert own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- Product links (for multi-retailer support)
CREATE TABLE public.product_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  retailer TEXT,
  current_price NUMERIC(10,2),
  currency TEXT DEFAULT 'INR',
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view links for accessible products" ON public.product_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_links.product_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.boards b WHERE b.id = p.board_id AND b.is_public = true
      ))
    )
  );

CREATE POLICY "Users can manage links for own products" ON public.product_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.products WHERE products.id = product_links.product_id AND products.user_id = auth.uid())
  );

-- Price history
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_link_id UUID REFERENCES public.product_links(id) ON DELETE CASCADE NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view price history for accessible products" ON public.price_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.product_links pl
      JOIN public.products p ON p.id = pl.product_id
      WHERE pl.id = price_history.product_link_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.boards b WHERE b.id = p.board_id AND b.is_public = true
      ))
    )
  );

CREATE POLICY "Users can insert price history for own products" ON public.price_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_links pl
      JOIN public.products p ON p.id = pl.product_id
      WHERE pl.id = price_history.product_link_id AND p.user_id = auth.uid()
    )
  );

-- Alert preferences
CREATE TABLE public.alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  price_drop_threshold INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alert preferences" ON public.alert_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alert_preferences_updated_at BEFORE UPDATE ON public.alert_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_boards_user_id ON public.boards(user_id);
CREATE INDEX idx_products_board_id ON public.products(board_id);
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_product_links_product_id ON public.product_links(product_id);
CREATE INDEX idx_price_history_product_link_id ON public.price_history(product_link_id);
CREATE INDEX idx_boards_share_token ON public.boards(share_token);