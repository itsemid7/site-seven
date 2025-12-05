class Navigation {
    constructor() {
        this.init();
    }

    async init() {
        await this.renderDesktopNav();
        await this.renderMobileNav();
        this.setupMobileToggle();
    }

    setupMobileToggle() {
        const trigger = document.querySelector('.mobile-menu-trigger');
        const mobileNav = document.querySelector('.mobile-nav');
        const overlay = document.querySelector('.mobile-overlay');

        if (trigger && mobileNav) {
            trigger.addEventListener('click', () => {
                mobileNav.classList.toggle('active');
                if (overlay) overlay.classList.toggle('active');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                overlay.classList.remove('active');
            });
        }
    }

    async renderDesktopNav() {
        const categories = await db.getCategories();
        const navContainer = document.querySelector('.nav-desktop ul');
        if (!navContainer) return;

        navContainer.innerHTML = categories.map(cat => {
            const hasSub = cat.subcategories && cat.subcategories.length > 0;
            return `
                <li class="${cat.slug === 'outlet' ? 'highlight' : ''}">
                    <a href="category.html?category=${cat.slug}">
                        ${cat.name} ${hasSub ? '<i class="fas fa-chevron-down" style="font-size: 0.7rem; margin-left: 5px;"></i>' : ''}
                    </a>
                    ${hasSub ? `
                        <ul class="dropdown-menu">
                            ${cat.subcategories.map(sub => `
                                <li><a href="category.html?category=${cat.slug}&subcategory=${sub.slug}">${sub.name}</a></li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </li>
            `;
        }).join('');
    }

    async renderMobileNav() {
        const categories = await db.getCategories();
        const navContainer = document.querySelector('.mobile-nav ul');
        if (!navContainer) return;

        let html = categories.map(cat => {
            const hasSub = cat.subcategories && cat.subcategories.length > 0;
            return `
                <li>
                    <div class="dropdown-toggle">
                        <a href="category.html?category=${cat.slug}">${cat.name}</a>
                        ${hasSub ? `<i class="fas fa-chevron-down" onclick="toggleMobileSubmenu(this)" style="cursor: pointer; padding: 10px;"></i>` : ''}
                    </div>
                    ${hasSub ? `
                        <ul class="dropdown-menu">
                            ${cat.subcategories.map(sub => `
                                <li><a href="category.html?category=${cat.slug}&subcategory=${sub.slug}">${sub.name}</a></li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </li>
            `;
        }).join('');

        html += '<li><a href="account.html">Minha Conta</a></li>';
        navContainer.innerHTML = html;
    }
}

// Helper for mobile toggle
window.toggleMobileSubmenu = (icon) => {
    const submenu = icon.parentElement.nextElementSibling;
    if (submenu) {
        submenu.classList.toggle('active');
        icon.style.transform = submenu.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
        icon.style.transition = 'transform 0.3s';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    new Navigation();
});
