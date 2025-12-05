class ReviewGenerator {
    constructor() {
        this.firstNames = [
            'Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Julia',
            'Kaique', 'Larissa', 'Marcelo', 'Natalia', 'Otavio', 'Paula', 'Rafael', 'Sabrina', 'Thiago', 'Vanessa',
            'Lucas', 'Matheus', 'Pedro', 'Gustavo', 'Felipe', 'Mariana', 'Beatriz', 'Camila', 'Luana', 'Amanda',
            'João', 'Maria', 'José', 'Francisco', 'Antônio', 'Paulo', 'Luiz', 'Marcos', 'Diego', 'Roberto'
        ];
        this.lastNames = [
            'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
            'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
            'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'
        ];
        this.comments = [
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
    }

    generate(count = 5) {
        const reviews = [];
        for (let i = 0; i < count; i++) {
            const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
            const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
            const comment = this.comments[Math.floor(Math.random() * this.comments.length)];

            let rating = Math.floor(Math.random() * 3) + 3; // 3, 4, 5
            if (rating < 4 && Math.random() < 0.8) rating = 5; // Bias towards 5

            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Last 60 days

            reviews.push({
                user_name: `${firstName} ${lastName}`,
                rating: rating,
                comment: comment,
                created_at: date.toISOString()
            });
        }
        return reviews;
    }
}

window.ReviewGenerator = ReviewGenerator;
