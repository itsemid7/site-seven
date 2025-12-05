-- Script de Correção de Colunas (Versão 4 - Preço Antigo e Outros)

DO $$
BEGIN
    -- Verificar e criar old_price
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='old_price') THEN
        ALTER TABLE public.products ADD COLUMN old_price numeric;
    END IF;

    -- Verificar e criar rating (caso falte)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='rating') THEN
        ALTER TABLE public.products ADD COLUMN rating numeric default 0;
    END IF;

    -- Verificar e criar reviews (caso falte)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='reviews') THEN
        ALTER TABLE public.products ADD COLUMN reviews integer default 0;
    END IF;
    
    -- Verificar e criar sales (caso falte)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sales') THEN
        ALTER TABLE public.products ADD COLUMN sales integer default 0;
    END IF;
END $$;

-- Recarregar schema
NOTIFY pgrst, 'reload schema';
