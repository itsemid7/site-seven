class App {
    constructor() {
        try {
            this.cart = JSON.parse(localStorage.getItem('seven_cart') || '[]');
        } catch (e) {
            console.error('Error parsing cart:', e);
            this.cart = [];
            localStorage.removeItem('seven_cart');
        }
        // Init is called, but we don't await it here as constructor cannot be async.
        // It will run in background.
        this.init();
    }

    async init() {
        this.updateCartCount();
        await this.renderHeaderUser();
        this.initHeroSlider();
        this.bindEvents();
        await this.loadBanners();
    }

    initHeroSlider() {
        if (this.sliderInterval) clearInterval(this.sliderInterval);

        const slides = document.querySelectorAll('.slide');
        if (slides.length === 0) return;

        let currentSlide = 0;
        // Set first active if none
        if (!document.querySelector('.slide.active')) {
            slides[0].classList.add('active');
        }

        const nextSlide = () => {
            if (!slides[currentSlide]) {
                currentSlide = 0;
            }
            // Double check existence
            if (slides[currentSlide]) {
                slides[currentSlide].classList.remove('active');
            }

            currentSlide = (currentSlide + 1) % slides.length;

            if (slides[currentSlide]) {
                slides[currentSlide].classList.add('active');
            }
        };

        this.sliderInterval = setInterval(nextSlide, 5000);
    }

    bindEvents() {
        // Global Cart Toggle
        // document.querySelector('.cart-trigger')?.addEventListener('click', () => this.toggleCart());

        // Mobile Menu Toggle
        // Mobile Menu Toggle logic is handled in nav.js to avoid conflicts
    }

    // Cart Methods
    getCart() {
        return this.cart;
    }

    addToCart(product, variant) {
        const size = variant ? variant.size : product.selectedSize;
        const color = variant ? variant.color : product.selectedColor;
        const quantity = (variant && variant.quantity) || product.quantity || 1;

        const existing = this.cart.find(item =>
            item.id === product.id &&
            item.size === size &&
            item.color === color
        );

        if (existing) {
            existing.quantity += quantity;
        } else {
            // Optimize storage: Don't store full product object, especially if it has huge base64 images
            // Only store what's needed for the cart display and checkout

            let imageUrl = product.image;
            // If image is a huge base64 string (e.g. > 500 chars), try to use a placeholder or check if it's really needed.
            // For now, we'll keep it but we should be careful. 
            // Better strategy: If it's an array of images, just take the first one.
            if (Array.isArray(product.images) && product.images.length > 0) {
                imageUrl = product.images[0];
            }

            // If it's still a huge base64, we might risk quota. 
            // But usually the issue is storing the WHOLE product object which might have 'images' array with MANY base64 strings.
            // By picking just one 'image' property, we save space.

            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                price_promo: product.price_promo,
                image: imageUrl, // Store only the main image
                slug: product.slug,
                size: size,
                color: color,
                quantity: quantity,
                weight: product.weight // Needed for freight
            });
        }

        this.saveCart();
        this.showToast('Produto adicionado ao carrinho!');
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.saveCart();
    }

    updateQuantity(index, delta) {
        const item = this.cart[index];
        if (item.quantity + delta > 0) {
            item.quantity += delta;
            this.saveCart();
        }
    }

    saveCart() {
        localStorage.setItem('seven_cart', JSON.stringify(this.cart));
        this.updateCartCount();
        // If cart sidebar is active, re-render it
        if (document.querySelector('.cart-sidebar.active')) {
            this.renderCartDrawer();
        }
    }

    updateCartCount() {
        const count = this.cart.reduce((acc, item) => acc + item.quantity, 0);
        const badges = document.querySelectorAll('.cart-count');
        badges.forEach(b => {
            b.textContent = count;
            b.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    getCartTotal() {
        return this.cart.reduce((acc, item) => {
            const price = item.price_promo || item.price;
            return acc + (price * item.quantity);
        }, 0);
    }

    toggleCart() {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.querySelector('.cart-overlay');

        if (sidebar && overlay) {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');

            if (sidebar.classList.contains('active')) {
                this.renderCartDrawer();
            }
        } else {
            // Fallback for pages without sidebar (like index.html currently)
            window.location.href = 'checkout.html';
        }
    }

    renderCartDrawer() {
        const container = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total-price');

        if (!container || !totalEl) return;

        if (this.cart.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px; color: #666;">Seu carrinho está vazio.</p>';
            totalEl.textContent = this.formatCurrency(0);
            return;
        }

        container.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p style="font-size: 0.8rem; color: #666; margin-bottom: 5px;">${item.size} | ${item.color}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="cart-item-price">${this.formatCurrency(item.price_promo || item.price)}</span>
                        <div style="display: flex; align-items: center; gap: 8px; border: 1px solid #eee; padding: 2px 5px; border-radius: 4px;">
                             <button onclick="app.updateQuantity(${index}, -1)" style="border:none; background:none; cursor:pointer; padding: 0 5px;">-</button>
                             <span style="font-size: 0.9rem;">${item.quantity}</span>
                             <button onclick="app.updateQuantity(${index}, 1)" style="border:none; background:none; cursor:pointer; padding: 0 5px;">+</button>
                        </div>
                    </div>
                    <button onclick="app.removeFromCart(${index})" style="color: #999; font-size: 0.7rem; background: none; border: none; cursor: pointer; margin-top: 8px; text-decoration: underline;">Remover</button>
                </div>
            </div>
        `).join('');

        totalEl.textContent = this.formatCurrency(this.getCartTotal());
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Add styles dynamically if not in CSS
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.background = 'var(--color-black)';
        toast.style.color = 'white';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '1000';
        toast.style.animation = 'fadeIn 0.3s ease';

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    async renderHeaderUser() {
        const user = await authService.getCurrentUser();
        const accountLink = document.querySelector('.account-link');
        if (accountLink) {
            if (user) {
                accountLink.href = 'account.html';
                accountLink.innerHTML = `<i class="fas fa-user-check"></i>`; // Logged in icon
            } else {
                accountLink.href = 'login.html';
                accountLink.innerHTML = `<i class="far fa-user"></i>`;
            }
        }
    }

    injectSearchOverlay() {
        // Do not inject in admin panel
        if (window.location.pathname.includes('/admin/')) return;

        if (!document.querySelector('.search-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'search-overlay';
            overlay.innerHTML = `
                <div class="search-container">
                    <button class="close-search"><i class="fas fa-times"></i></button>
                    <input type="text" class="search-input" placeholder="O QUE VOCÊ PROCURA?">
                </div>
            `;
            document.body.appendChild(overlay);
        }
    }

    bindSearchEvents() {
        this.injectSearchOverlay();

        const triggers = document.querySelectorAll('.search-trigger');
        const overlay = document.querySelector('.search-overlay');
        const closeBtn = document.querySelector('.close-search');
        const input = document.querySelector('.search-overlay .search-input');

        if (!overlay) return;

        triggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                overlay.classList.add('active');
                setTimeout(() => input.focus(), 100);
            });
        });

        const closeSearch = () => {
            overlay.classList.remove('active');
            input.value = '';
        };

        closeBtn?.addEventListener('click', closeSearch);

        // Close on click outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeSearch();
        });

        // Handle Enter key
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = input.value.trim();
                if (query) {
                    window.location.href = `category.html?search=${encodeURIComponent(query)}`;
                }
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                closeSearch();
            }
        });
    }

    // Banner System (Fixed)
    async loadBanners() {
        // Find containers
        const sliderContainer = document.querySelector('.slider-container');
        const promoContainer = document.querySelector('.promo-banners-grid');

        // Only proceed if at least one container exists
        if (!sliderContainer && !promoContainer) return;

        try {
            const banners = await db.getBanners();

            // 1. Filter Banners
            const heroBanners = banners.filter(b => b.type === 'hero');
            const promoBanners = banners.filter(b => b.type === 'promo' || !b.type);

            // 2. Render Hero Slider
            if (sliderContainer && heroBanners.length > 0) {
                sliderContainer.innerHTML = heroBanners.map((b, index) => `
                    <div class="slide ${index === 0 ? 'active' : ''}" 
                         style="background-image: url('${b.image}')"
                         onclick="window.location.href='${b.link || '#'}'">
                        <div class="slide-content container">
                             <h2 class="text-display" style="display:none;">${b.alt || ''}</h2>
                        </div>
                    </div>
                `).join('');

                this.initHeroSlider();
            }

            // 3. Render Promo Grid
            if (promoContainer) {
                if (promoBanners.length > 0) {
                    promoContainer.innerHTML = promoBanners.map(banner => `
                        <div class="promo-banner" onclick="window.location.href='${banner.link || '#'}'" style="cursor: pointer;">
                            <img src="${banner.image}" alt="${banner.alt}">
                            <div class="promo-content">
                                <h3>${banner.alt || 'Oferta'}</h3>
                                <a href="${banner.link || '#'}" class="btn btn-primary">Confira</a>
                            </div>
                        </div>
                    `).join('');
                    promoContainer.parentElement.style.display = 'block';
                } else {
                    promoContainer.innerHTML = '';
                    promoContainer.parentElement.style.display = 'none'; // Clear ghost banners
                }
            }

        } catch (e) {
            // Passive fail - don't crash app
            console.log('Banners not loaded or empty.');
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
}

const app = new App();
window.app = app;

document.addEventListener('DOMContentLoaded', () => {
    app.bindSearchEvents();
});
