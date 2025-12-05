-- Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id bigint REFERENCES public.products(id) ON DELETE CASCADE,
    user_name text NOT NULL,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reviews are insertable by everyone" ON public.reviews;
CREATE POLICY "Reviews are insertable by everyone" ON public.reviews FOR INSERT WITH CHECK (true);

-- Function to generate fake reviews
CREATE OR REPLACE FUNCTION public.generate_fake_reviews()
RETURNS TRIGGER AS $$
DECLARE
    review_count integer;
    i integer;
    random_user text;
    random_rating integer;
    random_comment text;
    
    -- List of Brazilian First Names
    first_names text[] := ARRAY[
        'Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Julia',
        'Kaique', 'Larissa', 'Marcelo', 'Natalia', 'Otavio', 'Paula', 'Rafael', 'Sabrina', 'Thiago', 'Vanessa',
        'Lucas', 'Matheus', 'Pedro', 'Gustavo', 'Felipe', 'Mariana', 'Beatriz', 'Camila', 'Luana', 'Amanda',
        'João', 'Maria', 'José', 'Francisco', 'Antônio', 'Paulo', 'Luiz', 'Marcos', 'Diego', 'Roberto'
    ];
    
    -- List of Brazilian Surnames
    last_names text[] := ARRAY[
        'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
        'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
        'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'
    ];

    -- Varied Comments
    comments text[] := ARRAY[
        'Produto excelente, superou minhas expectativas! A qualidade é incrível.',
        'Chegou super rápido e muito bem embalado. Recomendo a loja!',
        'Gostei bastante, o tamanho ficou perfeito. Comprarei novamente.',
        'Ótimo custo-benefício. O tecido é muito confortável.',
        'Perfeito! Exatamente como na foto. Estou muito satisfeito.',
        'Adorei! O caimento é ótimo e a cor é linda.',
        'Material de primeira qualidade. Valeu cada centavo.',
        'Entrega expressa funcionou mesmo! Chegou no mesmo dia.',
        'Satisfeito com a compra. O atendimento também foi nota 10.',
        'Lindo, igual à foto. Ficou ótimo no corpo.',
        'Muito bom, recomendo para todos. Qualidade Seven é diferenciada.',
        'Amei! Já quero outras cores.',
        'Produto top! Estiloso e confortável.',
        'Surpreendeu positivamente. Acabamento impecável.',
        'Chegou antes do prazo previsto. Muito bom!',
        'A peça é linda e veste super bem.',
        'Qualidade garantida. Virei cliente fiel.',
        'Tudo certo com o pedido. Recomendo.',
        'Gostei muito, parabéns pelo capricho.',
        'Show de bola! Produto muito style.'
    ];
BEGIN
    -- Determine random number of reviews (between 3 and 8)
    review_count := floor(random() * 6 + 3)::int;

    FOR i IN 1..review_count LOOP
        -- Generate Random Name
        random_user := first_names[floor(random() * array_length(first_names, 1) + 1)] || ' ' || 
                       last_names[floor(random() * array_length(last_names, 1) + 1)];
        
        -- Rating mostly 4 or 5, rarely 3
        random_rating := floor(random() * 3 + 3)::int; -- 3, 4, or 5
        IF random_rating < 4 THEN 
            -- 80% chance to upgrade 3 to 5
            IF random() < 0.8 THEN random_rating := 5; END IF;
        END IF; 
        
        random_comment := comments[floor(random() * array_length(comments, 1) + 1)];

        INSERT INTO public.reviews (product_id, user_name, rating, comment, created_at)
        VALUES (NEW.id, random_user, random_rating, random_comment, now() - (random() * interval '60 days'));
    END LOOP;

    -- Update product rating and reviews count
    UPDATE public.products
    SET 
        reviews = review_count,
        rating = (SELECT AVG(rating) FROM public.reviews WHERE product_id = NEW.id)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for New Products
DROP TRIGGER IF EXISTS on_product_created_add_reviews ON public.products;
CREATE TRIGGER on_product_created_add_reviews
AFTER INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.generate_fake_reviews();

-- Backfill for Existing Products
DO $$
DECLARE
    prod RECORD;
    exists_reviews integer;
    
    -- Lists (Duplicated for DO block scope)
    first_names text[] := ARRAY[
        'Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Julia',
        'Kaique', 'Larissa', 'Marcelo', 'Natalia', 'Otavio', 'Paula', 'Rafael', 'Sabrina', 'Thiago', 'Vanessa',
        'Lucas', 'Matheus', 'Pedro', 'Gustavo', 'Felipe', 'Mariana', 'Beatriz', 'Camila', 'Luana', 'Amanda',
        'João', 'Maria', 'José', 'Francisco', 'Antônio', 'Paulo', 'Luiz', 'Marcos', 'Diego', 'Roberto'
    ];
    last_names text[] := ARRAY[
        'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
        'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
        'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'
    ];
    comments text[] := ARRAY[
        'Produto excelente, superou minhas expectativas! A qualidade é incrível.',
        'Chegou super rápido e muito bem embalado. Recomendo a loja!',
        'Gostei bastante, o tamanho ficou perfeito. Comprarei novamente.',
        'Ótimo custo-benefício. O tecido é muito confortável.',
        'Perfeito! Exatamente como na foto. Estou muito satisfeito.',
        'Adorei! O caimento é ótimo e a cor é linda.',
        'Material de primeira qualidade. Valeu cada centavo.',
        'Entrega expressa funcionou mesmo! Chegou no mesmo dia.',
        'Satisfeito com a compra. O atendimento também foi nota 10.',
        'Lindo, igual à foto. Ficou ótimo no corpo.',
        'Muito bom, recomendo para todos. Qualidade Seven é diferenciada.',
        'Amei! Já quero outras cores.',
        'Produto top! Estiloso e confortável.',
        'Surpreendeu positivamente. Acabamento impecável.',
        'Chegou antes do prazo previsto. Muito bom!',
        'A peça é linda e veste super bem.',
        'Qualidade garantida. Virei cliente fiel.',
        'Tudo certo com o pedido. Recomendo.',
        'Gostei muito, parabéns pelo capricho.',
        'Show de bola! Produto muito style.'
    ];
BEGIN
    FOR prod IN SELECT * FROM public.products LOOP
        -- Check if product already has reviews
        SELECT COUNT(*) INTO exists_reviews FROM public.reviews WHERE product_id = prod.id;
        
        IF exists_reviews = 0 THEN
            DECLARE
                review_count integer;
                j integer;
                random_user text;
                random_rating integer;
                random_comment text;
            BEGIN
                review_count := floor(random() * 6 + 3)::int;
                
                FOR j IN 1..review_count LOOP
                    random_user := first_names[floor(random() * array_length(first_names, 1) + 1)] || ' ' || 
                                   last_names[floor(random() * array_length(last_names, 1) + 1)];
                                   
                    random_rating := floor(random() * 3 + 3)::int;
                    IF random_rating < 4 THEN IF random() < 0.8 THEN random_rating := 5; END IF; END IF;
                    
                    random_comment := comments[floor(random() * array_length(comments, 1) + 1)];
                    
                    INSERT INTO public.reviews (product_id, user_name, rating, comment, created_at)
                    VALUES (prod.id, random_user, random_rating, random_comment, now() - (random() * interval '60 days'));
                END LOOP;

                -- Update product stats
                UPDATE public.products
                SET 
                    reviews = review_count,
                    rating = (SELECT AVG(rating) FROM public.reviews WHERE product_id = prod.id)
                WHERE id = prod.id;
            END;
        END IF;
    END LOOP;
END $$;
