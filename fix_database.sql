-- Execute este comando no Editor SQL do Supabase para corrigir o erro de salvamento de categorias

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS subcategories JSONB DEFAULT '[]'::jsonb;

-- Garante que a coluna video existe na tabela products (para o erro do vídeo, por precaução)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS video TEXT;
