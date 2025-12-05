-- Script de Correção de Colunas (Versão 2 - Compatível com BigInt)

DO $$
BEGIN
    -- 1. Verificar e criar category_id na tabela products
    -- O erro anterior mostrou que categories.id é BIGINT, então category_id deve ser BIGINT também.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category_id') THEN
        ALTER TABLE public.products ADD COLUMN category_id bigint references public.categories(id);
        RAISE NOTICE 'Coluna category_id (bigint) criada com sucesso.';
    END IF;

    -- 2. Verificar e criar outras colunas se faltarem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sizes') THEN
        ALTER TABLE public.products ADD COLUMN sizes text[] default '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='colors') THEN
        ALTER TABLE public.products ADD COLUMN colors text[] default '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='images') THEN
        ALTER TABLE public.products ADD COLUMN images text[] default '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='video') THEN
        ALTER TABLE public.products ADD COLUMN video text;
    END IF;
END $$;

-- Recarregar schema
NOTIFY pgrst, 'reload schema';
