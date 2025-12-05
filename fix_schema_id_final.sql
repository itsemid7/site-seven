-- Script de Correção Final de ID (Sincronizar Sequência)
-- Este script garante que a geração automática de IDs (Identity) esteja sincronizada.

DO $$
DECLARE
    max_id bigint;
BEGIN
    -- Pegar o maior ID atual
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM public.products;
    
    -- Reiniciar a sequência para o próximo valor
    -- Isso corrige erros de "duplicate key" ou problemas na geração
    EXECUTE 'ALTER TABLE public.products ALTER COLUMN id RESTART WITH ' || (max_id + 1);
    
    RAISE NOTICE 'Sequência de ID sincronizada para: %', max_id + 1;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Não foi possível reiniciar a sequência. Verifique se a coluna é realmente Identity.';
END $$;
