-- Script de Correção de ID (Auto-geração)
-- O erro "null value in column id" indica que o ID não está sendo gerado automaticamente.

DO $$
BEGIN
    -- Alterar a coluna ID para gerar UUIDs automaticamente
    ALTER TABLE public.products ALTER COLUMN id SET DEFAULT gen_random_uuid();
    
    RAISE NOTICE 'Coluna ID alterada para gerar UUIDs automaticamente.';
EXCEPTION
    WHEN undefined_function THEN
        -- Fallback para uuid_generate_v4 se gen_random_uuid não existir (Postgres antigo)
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        ALTER TABLE public.products ALTER COLUMN id SET DEFAULT uuid_generate_v4();
END $$;

-- Recarregar schema
NOTIFY pgrst, 'reload schema';
