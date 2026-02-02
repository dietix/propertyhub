-- Schema SQL para criar as tabelas no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários (complementa auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de propriedades
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Brasil',
  zip_code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'house', 'studio', 'villa', 'cabin', 'other')),
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  max_guests INTEGER NOT NULL DEFAULT 2,
  amenities TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  base_price DECIMAL(10,2) NOT NULL,
  cleaning_fee DECIMAL(10,2) DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  owner_id UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de reservas
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT DEFAULT '',
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  number_of_guests INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  cleaning_fee DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled')),
  source TEXT NOT NULL CHECK (source IN ('airbnb', 'booking', 'vrbo', 'direct', 'other')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de transações financeiras
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de bloqueios de datas
CREATE TABLE IF NOT EXISTS public.date_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_properties_owner ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_active ON public.properties(is_active);
CREATE INDEX IF NOT EXISTS idx_reservations_property ON public.reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_transactions_property ON public.transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_date_blocks_property ON public.date_blocks(property_id);
CREATE INDEX IF NOT EXISTS idx_date_blocks_dates ON public.date_blocks(start_date, end_date);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_blocks ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para properties (admins e managers podem tudo, viewers só lêem)
CREATE POLICY "Anyone authenticated can view properties" ON public.properties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners can insert properties" ON public.properties
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their properties" ON public.properties
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their properties" ON public.properties
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Políticas para reservations
CREATE POLICY "Anyone authenticated can view reservations" ON public.reservations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can insert reservations" ON public.reservations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update reservations" ON public.reservations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can delete reservations" ON public.reservations
  FOR DELETE TO authenticated USING (true);

-- Políticas para transactions
CREATE POLICY "Anyone authenticated can view transactions" ON public.transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can insert transactions" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update transactions" ON public.transactions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can delete transactions" ON public.transactions
  FOR DELETE TO authenticated USING (true);

-- Políticas para date_blocks
CREATE POLICY "Anyone authenticated can view date_blocks" ON public.date_blocks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can insert date_blocks" ON public.date_blocks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update date_blocks" ON public.date_blocks
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can delete date_blocks" ON public.date_blocks
  FOR DELETE TO authenticated USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_date_blocks_updated_at
  BEFORE UPDATE ON public.date_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar usuário automaticamente ao fazer signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'viewer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil de usuário automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
