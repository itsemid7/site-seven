class DB {
    constructor() {
        // Wait for window.supabaseClient to be available if loaded async, 
        // but since we use standard scripts in order, it should be ready.
        this.client = window.supabaseClient;
        if (!this.client) {
            console.warn('Supabase client not initialized in DB constructor. Make sure supabase-init.js is loaded.');
        }
    }

    // Categories
    async getCategories() {
        if (!this.client) return [];
        const { data, error } = await this.client
            .from('categories')
            .select('*')
            .order('name');
        if (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
        return data;
    }

    async getHomeCategories() {
        // Return categories that have an image, or all if needed
        return this.getCategories();
    }

    async addCategory(category) {
        const { data, error } = await this.client
            .from('categories')
            .insert([{
                name: category.name,
                slug: category.slug,
                image: category.image,
                subcategories: category.subcategories // Add subcategories
            }])
            .select();
        if (error) throw error;
        return data[0];
    }

    async updateCategory(category) {
        const { data, error } = await this.client
            .from('categories')
            .update({
                name: category.name,
                slug: category.slug,
                image: category.image,
                subcategories: category.subcategories // Add subcategories
            })
            .eq('id', category.id)
            .select();
        if (error) throw error;
        return data[0];
    }

    async deleteCategory(id) {
        const { error } = await this.client
            .from('categories')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }

    generateSlug(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    // Products
    async getProducts(filters = {}) {
        if (!this.client) return [];

        let select = '*, categories(name, slug)';
        // If filtering by specific category slug (not special ones), we need inner join
        if (filters.category && !['novidades', 'destaques', 'mais-vendidos', 'outlet'].includes(filters.category)) {
            select = '*, categories!inner(name, slug)';
        }

        let query = this.client.from('products').select(select);

        // Apply filters
        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        if (filters.is_new) {
            query = query.eq('is_new', true);
        }

        if (filters.is_featured) {
            query = query.eq('is_featured', true);
        }

        if (filters.is_bestseller) {
            query = query.eq('is_bestseller', true);
        }

        if (filters.search) {
            query = query.ilike('name', `%${filters.search}%`);
        }

        if (filters.category) {
            if (filters.category === 'novidades') query = query.eq('is_new', true);
            else if (filters.category === 'destaques') query = query.eq('is_featured', true);
            else if (filters.category === 'mais-vendidos') query = query.eq('is_bestseller', true);
            else if (filters.category === 'outlet') query = query.not('old_price', 'is', null);
            else {
                query = query.eq('categories.slug', filters.category);
            }
        }

        try {
            const { data, error } = await query;

            if (error) throw error;

            // Map category_id to category object if needed, or rely on join
            return data.map(p => ({
                ...p,
                category: p.categories ? p.categories.name : 'Sem Categoria',
                categorySlug: p.categories ? p.categories.slug : ''
            }));
        } catch (err) {
            console.warn('Error fetching products with category join, falling back to simple fetch:', err);
            // Fallback: Fetch without join
            const { data, error } = await this.client.from('products').select('*');
            if (error) {
                console.error('Error fetching products (fallback):', error);
                return [];
            }
            return data.map(p => ({
                ...p,
                category: 'Erro ao carregar',
                categorySlug: ''
            }));
        }
    }

    async getProduct(idOrSlug) {
        if (!this.client) return null;
        // Try ID first (UUID)
        let query = this.client.from('products').select('*, categories(*)');

        // Check if it's a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        // Check if it's a numeric ID (for legacy/bigint IDs)
        const isNumeric = /^\d+$/.test(idOrSlug);

        if (isUUID || isNumeric) {
            query = query.eq('id', idOrSlug);
        } else {
            query = query.eq('slug', idOrSlug);
        }

        // Use limit(1) to avoid error if multiple products have same slug
        const { data: products, error } = await query.limit(1);

        if (error) {
            console.error('Error fetching product:', error);
            return null;
        }

        const data = products && products.length > 0 ? products[0] : null;

        if (!data) return null;

        return {
            ...data,
            category: data.categories ? data.categories.name : '',
            categorySlug: data.categories ? data.categories.slug : ''
        };
    }

    async addProduct(product) {
        // Remove helper props that are not in DB
        const { category, categorySlug, ...dbProduct } = product;

        // Ensure we don't send an empty ID, letting the DB generate it
        if (!dbProduct.id) delete dbProduct.id;

        const { data, error } = await this.client
            .from('products')
            .insert([dbProduct])
            .select();
        if (error) throw error;
        return data[0];
    }

    async updateProduct(product) {
        const { category, categorySlug, ...dbProduct } = product;
        const { data, error } = await this.client
            .from('products')
            .update(dbProduct)
            .eq('id', product.id)
            .select();
        if (error) throw error;
        return data[0];
    }

    async deleteProduct(id) {
        const { error } = await this.client
            .from('products')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }

    // Reviews (Mock or Real?)
    // Reviews
    async getReviews(productId) {
        if (!this.client) return [];

        const { data, error } = await this.client
            .from('reviews')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }

        return data.map(r => ({
            user: r.user_name,
            rating: r.rating,
            comment: r.comment,
            date: new Date(r.created_at).toLocaleDateString('pt-BR')
        }));
    }

    // Orders
    async getOrders() {
        if (!this.client) return [];
        const { data, error } = await this.client
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
        return data;
    }

    async saveOrder(order) {
        const { data, error } = await this.client
            .from('orders')
            .insert([order])
            .select();
        if (error) throw error;
        return data[0];
    }

    async updateOrderStatus(id, status) {
        const { data, error } = await this.client
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    }

    async getOrdersByUserId(userId) {
        if (!this.client) return [];
        const { data, error } = await this.client
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user orders:', error);
            return [];
        }
        return data;
    }

    // Banners
    async getBanners() {
        if (!this.client) return [];
        const { data, error } = await this.client
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching banners:', error);
            // Fallback to empty array if table doesn't exist yet
            return [];
        }
        return data;
    }

    async addBanner(banner) {
        const { data, error } = await this.client
            .from('banners')
            .insert([{
                image: banner.image,
                image_mobile: banner.image_mobile,
                link: banner.link,
                alt: banner.alt,
                type: banner.type || 'hero' // Default to hero
            }])
            .select();
        if (error) throw error;
        return data[0];
    }

    async deleteBanner(id) {
        const { error } = await this.client
            .from('banners')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }

    // Users
    async getUsers() {
        if (!this.client) return [];
        // Fetch profiles which should be public/readable for admins
        const { data, error } = await this.client
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }

        return data.map(u => ({
            id: u.id,
            name: u.full_name || u.email, // Fallback
            email: u.email,
            phone: u.phone,
            role: u.role || 'customer',
            createdAt: u.created_at
        }));
    }

    async updateUser(user) {
        // Use RPC function to bypass RLS issues
        const { data, error } = await this.client.rpc('update_profile_admin', {
            target_id: user.id,
            new_name: user.name,
            new_phone: user.phone,
            new_role: user.role
        });

        if (error) {
            console.error('Error updating user (RPC):', error);
            // Fallback: Try direct update if RPC fails (e.g. function not created yet)
            return this.updateUserDirect(user);
        }

        return data;
    }

    async updateUserDirect(user) {
        const { data, error } = await this.client
            .from('profiles')
            .update({
                full_name: user.name,
                phone: user.phone,
                role: user.role
            })
            .eq('id', user.id)
            .select();

        if (error) {
            console.error('Error updating user (Direct):', error);
            throw error;
        }

        if (!data || data.length === 0) {
            // If update succeeded (no error) but returned no data, it might be an RLS policy
            // that allows UPDATE but denies SELECT. We assume success.
            console.warn('Update successful but no data returned (RLS?); assuming success.');
            return user;
        }

        return data[0];
    }

    async deleteUser(id) {
        // Note: Deleting from auth.users requires service_role key or backend function.
        // We can only delete from 'profiles' here if RLS allows.
        const { error } = await this.client
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting user:', error);
            return false;
        }
        return true;
    }

    async logout() {
        const { error } = await this.client.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
            return false;
        }
        return true;
    }

    // Config (Mock)
    // Config (Real)
    async getConfig() {
        if (!this.client) return null;
        const { data, error } = await this.client
            .from('store_settings')
            .select('freight_config')
            .eq('id', 1)
            .single();

        if (error) {
            console.warn('Error fetching config (might not exist yet):', error);
            // Return default structure if not found
            return {
                lalamove: { active: false, pricing_table: {} },
                correios: { active: false }
            };
        }
        return data.freight_config;
    }

    async saveConfig(config) {
        if (!this.client) throw new Error('Supabase client not initialized');

        const { data, error } = await this.client
            .from('store_settings')
            .upsert({
                id: 1,
                freight_config: config,
                updated_at: new Date()
            })
            .select();

        if (error) throw error;
        return data[0];
    }
}

const db = new DB();
window.db = db;
