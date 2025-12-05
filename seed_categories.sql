-- 1. Garantir que a coluna 'slug' seja única (necessário para evitar duplicatas)
DO $$
BEGIN
    -- Verifica se já existe a restrição de unicidade, se não, cria
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_key'
    ) THEN
        -- Tenta adicionar a constraint. Se falhar porque já tem duplicatas, você precisará limpar a tabela antes.
        BEGIN
            ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Não foi possível adicionar constraint unique. Verifique se há slugs duplicados.';
        END;
    END IF;
END $$;

-- 2. Inserir Categorias Iniciais
INSERT INTO public.categories (name, slug, image) VALUES
('Camisetas', 'camisetas', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=60'),
('Calças', 'calcas', 'https://images.unsplash.com/photo-1542272617-08f08630252f?auto=format&fit=crop&w=500&q=60'),
('Tênis', 'tenis', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=60'),
('Acessórios', 'acessorios', 'https://images.unsplash.com/photo-1523293188086-b589b9b40f21?auto=format&fit=crop&w=500&q=60'),
('Casacos', 'casacos', 'https://images.unsplash.com/photo-1551028919-30164778288c?auto=format&fit=crop&w=500&q=60'),
('Bermudas', 'bermudas', 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=500&q=60')
ON CONFLICT (slug) DO NOTHING;