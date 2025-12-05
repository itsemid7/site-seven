-- Script de Correção de Colunas
-- Este script verifica se a coluna 'category_id' existe e a cria se estiver faltando.

DO $$
BEGIN
    -- Verificar e criar category_id na tabela products
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category_id') THEN
        ALTER TABLE public.products ADD COLUMN category_id uuid references public.categories(id);
        RAISE NOTICE 'Coluna category_id criada com sucesso.';
    END IF;

    -- Verificar e criar sizes na tabela products (caso falte)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sizes') THEN
        ALTER TABLE public.products ADD COLUMN sizes text[] default '{}';
    END IF;

    -- Verificar e criar colors na tabela products (caso falte)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='colors') THEN
        ALTER TABLE public.products ADD COLUMN colors text[] default '{}';
    END IF;
    
    -- Verificar e criar images na tabela products (caso falte)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='images') THEN
        ALTER TABLE public.products ADD COLUMN images text[] default '{}';
    END IF;
END $$;

-- Recarregar o cache do schema (truque: notificar o postgrest)
NOTIFY pgrst, 'reload schema';
