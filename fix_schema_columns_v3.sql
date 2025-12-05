-- Script de Correção de Colunas (Versão 3 - Booleanos)

DO $$
BEGIN
    -- Verificar e criar is_featured
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_featured') THEN
        ALTER TABLE public.products ADD COLUMN is_featured boolean default false;
    END IF;

    -- Verificar e criar is_bestseller
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_bestseller') THEN
        ALTER TABLE public.products ADD COLUMN is_bestseller boolean default false;
    END IF;

    -- Verificar e criar is_new
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_new') THEN
        ALTER TABLE public.products ADD COLUMN is_new boolean default false;
    END IF;
    
    -- Garantir que outras colunas essenciais existam
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='active') THEN
        ALTER TABLE public.products ADD COLUMN active boolean default true;
    END IF;
END $$;

-- Recarregar schema (Importante!)
NOTIFY pgrst, 'reload schema';
