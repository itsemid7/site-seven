document.addEventListener('DOMContentLoaded', async () => {
    await renderBanners();
    await renderHomeCategories();
    await renderFeaturedProducts();
});

async function renderBanners() {
    const sliderContainer = document.querySelector('.slider-container');
    if (!sliderContainer) return;

    try {
        const banners = await db.getBanners();

        if (banners && banners.length > 0) {
            sliderContainer.innerHTML = banners.map((banner, index) => `
                <div class="slide ${index === 0 ? 'active' : ''}"
                    style="background-image: url('${banner.image}');">
                    <div class="slide-content container">
                        <h2 class="text-display">${banner.alt || 'NOVA COLEÇÃO'}</h2>
                        <p>Confira as novidades e ofertas exclusivas.</p>
                        <a href="${banner.link || '#'}" class="btn btn-primary">VER MAIS</a>
                    </div>
                </div>
            `).join('');

            // Re-initialize slider logic if needed (assuming CSS handles simple active class or main.js has logic)
            // If main.js has a slider interval, it might need to be restarted or it might just work if it selects .slide
            // Let's check main.js later if slider doesn't auto-rotate.
        }
    } catch (error) {
        console.error('Erro ao carregar banners:', error);
    }
}

async function renderHomeCategories() {
    const container = document.getElementById('home-categories');
    if (!container) return;

    let categories = await db.getCategories();

    // Filter out 'outlet' or special cats if needed, or keep all
    // Randomize
    categories = categories.sort(() => 0.5 - Math.random());

    // Take 4
    const selected = categories.slice(0, 4);

    // Map of default images if category has no image
    const defaultImages = {
        'acessorios': 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&q=80&w=800', // Accessories
        'bermudas': 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=800', // Shorts
        'calcas': 'https://images.unsplash.com/photo-1542272617-08f086302542?auto=format&fit=crop&q=80&w=800', // Pants
        'camisetas': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800', // T-Shirts
        'casacos': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800', // Jackets
        'tenis': 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800', // Sneakers
        'default': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800'
    };

    container.innerHTML = selected.map(cat => {
        const img = cat.image || defaultImages[cat.slug] || defaultImages['default'];
        return `
            <div class="category-card" onclick="window.location.href='category.html?category=${cat.slug}'" style="cursor: pointer;">
                <img src="${img}" alt="${cat.name}">
                <div class="category-content">
                    <h3>${cat.name}</h3>
                    <a href="category.html?category=${cat.slug}" class="btn-link">Ver Produtos <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        `;
    }).join('');
}

async function renderFeaturedProducts() {
    const featuredContainer = document.getElementById('featured-products');
    const bestsellersContainer = document.getElementById('best-sellers'); // Fixed ID

    // Show loading state
    if (featuredContainer) featuredContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Carregando destaques...</p>';
    if (bestsellersContainer) bestsellersContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Carregando mais vendidos...</p>';

    try {
        // Fetch specific lists directly from DB to avoid loading all products
        // We fetch 8 to allow some randomization on the client side
        const featuredPromise = db.getProducts({ is_featured: true, limit: 8 });
        const bestsellersPromise = db.getProducts({ is_bestseller: true, limit: 8 });

        const [featured, bestsellers] = await Promise.all([featuredPromise, bestsellersPromise]);

        if (featuredContainer) {
            const selected = featured.sort(() => 0.5 - Math.random()).slice(0, 4);
            featuredContainer.innerHTML = renderProductGrid(selected);
        }

        if (bestsellersContainer) {
            const selected = bestsellers.sort(() => 0.5 - Math.random()).slice(0, 4);
            bestsellersContainer.innerHTML = renderProductGrid(selected);
        }
    } catch (error) {
        console.error('Erro ao carregar produtos da home:', error);
        if (featuredContainer) featuredContainer.innerHTML = '<p>Erro ao carregar.</p>';
        if (bestsellersContainer) bestsellersContainer.innerHTML = '<p>Erro ao carregar.</p>';
    }
}

function renderProductGrid(products) {
    if (!products || products.length === 0) return '<p>Nenhum produto encontrado.</p>';

    return products.map(product => {
        const img = product.images && product.images.length > 0 ? product.images[0] : (product.image || 'https://via.placeholder.com/300');
        const price = parseFloat(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        return `
        <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'">
            <div class="product-image">
                ${product.is_new ? '<span class="badge new">Novo</span>' : ''}
                ${product.old_price ? '<span class="badge promo">Promo</span>' : ''}
                <img src="${img}" alt="${product.name}">
                <div class="product-actions">
                    <button onclick="event.stopPropagation(); addToCart('${product.id}')">Adicionar ao Carrinho</button>
                </div>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="price">
                    ${product.old_price ? `<span class="old-price">R$ ${parseFloat(product.old_price).toFixed(2).replace('.', ',')}</span>` : ''}
                    <span class="current-price">${price}</span>
                </div>
            </div>
        </div>
        `;
    }).join('');
}
