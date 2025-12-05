
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://bwpskigahszxkgzxtewf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cHNraWdhaHN6eGtnenh0ZXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDQzMDgsImV4cCI6MjA4MDI4MDMwOH0.D99euPduBI0kJuE0u3Yw4fJCsvT5LSyO4VTbtbY3TD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const firstNames = [
    'Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Julia',
    'Kaique', 'Larissa', 'Marcelo', 'Natalia', 'Otavio', 'Paula', 'Rafael', 'Sabrina', 'Thiago', 'Vanessa',
    'Lucas', 'Matheus', 'Pedro', 'Gustavo', 'Felipe', 'Mariana', 'Beatriz', 'Camila', 'Luana', 'Amanda',
    'João', 'Maria', 'José', 'Francisco', 'Antônio', 'Paulo', 'Luiz', 'Marcos', 'Diego', 'Roberto'
];

const lastNames = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
    'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
    'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'
];

const comments = [
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

async function seedReviews() {
    console.log('Starting reviews seed...');

    // 1. Get all products
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name');

    if (prodError) {
        console.error('Error fetching products:', prodError);
        return;
    }

    console.log(`Found ${products.length} products.`);

    for (const product of products) {
        // Check if already has reviews
        const { count, error: countError } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product.id);

        if (countError) {
            console.error(`Error checking reviews for ${product.name}:`, countError);
            continue;
        }

        if (count > 0) {
            console.log(`Product ${product.name} already has reviews. Skipping.`);
            continue;
        }

        // Generate 3-8 reviews
        const reviewCount = Math.floor(Math.random() * 6) + 3;
        const reviewsToInsert = [];
        let totalRating = 0;

        for (let i = 0; i < reviewCount; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const comment = comments[Math.floor(Math.random() * comments.length)];

            let rating = Math.floor(Math.random() * 3) + 3; // 3, 4, 5
            if (rating < 4 && Math.random() < 0.8) rating = 5; // Bias towards 5

            totalRating += rating;

            const daysAgo = Math.floor(Math.random() * 60);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);

            reviewsToInsert.push({
                product_id: product.id,
                user_name: `${firstName} ${lastName}`,
                rating: rating,
                comment: comment,
                created_at: date.toISOString()
            });
        }

        // Insert reviews
        const { error: insertError } = await supabase
            .from('reviews')
            .insert(reviewsToInsert);

        if (insertError) {
            console.error(`Error inserting reviews for ${product.name}:`, insertError);
        } else {
            console.log(`Added ${reviewCount} reviews for ${product.name}`);

            // Update product stats
            const avgRating = totalRating / reviewCount;
            await supabase
                .from('products')
                .update({
                    reviews: reviewCount,
                    rating: avgRating
                })
                .eq('id', product.id);
        }
    }

    console.log('Reviews seed completed!');
}

seedReviews();
