-- Script para adicionar tabela de senhas de acesso
-- Execute este script no SQL Editor do Supabase Dashboard

-- Tabela de senhas de acesso
CREATE TABLE IF NOT EXISTS public.access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  description TEXT DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_access_codes_property ON public.access_codes(property_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_dates ON public.access_codes(start_date, end_date);

-- Row Level Security (RLS)
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Políticas para access_codes
CREATE POLICY "Anyone authenticated can view access_codes" ON public.access_codes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can insert access_codes" ON public.access_codes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update access_codes" ON public.access_codes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can delete access_codes" ON public.access_codes
  FOR DELETE TO authenticated USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_access_codes_updated_at
  BEFORE UPDATE ON public.access_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
