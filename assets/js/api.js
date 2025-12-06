class FreightService {
    constructor() {
        this.db = new DB();
    }

    async calculateFreight(cep, cartTotal, cartItems = [], addressData = null) {
        // 1. Get Config
        const config = await this.db.getConfig();

        const lalamoveConfig = config?.lalamove || { active: false, pricing_table: {} };
        const correiosConfig = config?.correios || { active: false, pac_base: 20, pac_kg: 5, sedex_base: 35, sedex_kg: 8 };

        const options = [];

        // 2. Calculate Weight (Estimate 0.5kg per item if not defined)
        const totalWeight = cartItems.reduce((total, item) => {
            const itemWeight = item.weight || 0.5;
            return total + (itemWeight * item.quantity);
        }, 0);

        // 3. Correios Calculation (Weight-based)
        if (correiosConfig.active) {
            // PAC
            const pacPrice = correiosConfig.pac_base + (totalWeight * correiosConfig.pac_kg);
            options.push({
                name: 'PAC',
                price: pacPrice,
                deadline: '5-7 dias úteis',
                days: 7,
                carrier: 'CORREIOS',
                service: 'PAC',
                icon: 'fa-box'
            });

            // SEDEX
            const sedexPrice = correiosConfig.sedex_base + (totalWeight * correiosConfig.sedex_kg);
            options.push({
                name: 'SEDEX',
                price: sedexPrice,
                deadline: '2-3 dias úteis',
                days: 3,
                carrier: 'CORREIOS',
                service: 'SEDEX',
                icon: 'fa-shipping-fast'
            });
        }

        // 4. Lalamove Calculation (Distance-based)
        if (lalamoveConfig.active && lalamoveConfig.origin_cep) {
            try {
                // Get Coordinates
                const originCoords = await this.getCoordinates(lalamoveConfig.origin_cep);
                const destCoords = await this.getCoordinates(cep, addressData);

                if (originCoords && destCoords) {
                    const distanceKm = this.calculateDistance(
                        originCoords.lat, originCoords.lon,
                        destCoords.lat, destCoords.lon
                    );

                    console.log(`Distance from ${lalamoveConfig.origin_cep} to ${cep}: ${distanceKm.toFixed(2)} km`);

                    // 50km Hard Limit Check
                    if (distanceKm > 50) {
                        console.log(`[Lalamove] Distance (${distanceKm.toFixed(2)}km) exceeds 50km limit. Skipping Lalamove.`);
                        // Exit the Lalamove block here so no option is added
                    } else {
                        // Calculate Cumulative Price
                        // User requirement: "ir somando a KM que aparece"
                        // Example: Distance 3km -> Price(Km1) + Price(Km2) + Price(Km3)

                        let totalPrice = 0;
                        const maxKm = Math.ceil(distanceKm);

                        // Iterate from 1 up to the total distance
                        for (let i = 1; i <= maxKm; i++) {
                            const kmKey = i.toString();
                            let kmPrice = 0;

                            if (lalamoveConfig.pricing_table[kmKey]) {
                                // Parse price, handling potential comma/dot issues if stored as string
                                const rawPrice = lalamoveConfig.pricing_table[kmKey].toString().replace(',', '.');
                                kmPrice = parseFloat(rawPrice);
                            } else {
                                // If specific KM not defined, try to use the last defined value or 0
                                // For now, let's assume 0 or maybe the value of the last known KM?
                                // Safest is 0 or a default fallback if the table is incomplete.
                                // Given the user fills a grid, it should be there.
                                // Let's try to find the last defined price if missing.
                                const keys = Object.keys(lalamoveConfig.pricing_table).map(k => parseInt(k)).sort((a, b) => a - b);
                                const lastKey = keys[keys.length - 1];
                                if (lastKey && i > lastKey) {
                                    const rawPrice = lalamoveConfig.pricing_table[lastKey.toString()].toString().replace(',', '.');
                                    kmPrice = parseFloat(rawPrice);
                                }
                            }

                            if (!isNaN(kmPrice)) {
                                totalPrice += kmPrice;
                            }
                        }

                        if (totalPrice > 0) {
                            options.push({
                                name: 'Lalamove',
                                price: parseFloat(totalPrice.toFixed(2)),
                                deadline: 'Hoje (Entrega Imediata)',
                                days: 0,
                                carrier: 'LALAMOVE',
                                service: 'MOTOBOY',
                                icon: 'fa-motorcycle'
                            });
                        }
                    } // End 50km Check
                }
            } catch (err) {
                console.error('Error calculating Lalamove freight:', err);
                // Fail silently for Lalamove if coord fetch fails, don't block Correios
            }
        }

        // Fallback if no options
        if (options.length === 0) {
            options.push({
                name: 'Entrega Padrão',
                price: 25.00,
                deadline: '5-7 dias úteis',
                days: 7,
                carrier: 'CORREIOS',
                service: 'PAC',
                icon: 'fa-box'
            });
        }

        return options;
    }

    // Helper: Get Coordinates from Nominatim (OpenStreetMap)
    async getCoordinates(cep, addressData = null) {
        try {
            // 1. Try by CEP
            const cleanCep = cep.replace(/\D/g, '');
            let url = `https://nominatim.openstreetmap.org/search?postalcode=${cleanCep}&country=Brazil&format=json&limit=1`;

            let response = await fetch(url, {
                headers: { 'User-Agent': 'SevenOutlet/1.0' }
            });
            let data = await response.json();

            if (data && data.length > 0) {
                console.log(`[Lalamove] Coords found for CEP ${cep}:`, data[0].lat, data[0].lon);
                return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            }

            // 2. Fallback: Try by Address if provided
            if (addressData) {
                console.log(`[Lalamove] Coords not found for CEP ${cep}. Trying address fallback...`);
                const query = `${addressData.street}, ${addressData.city}, ${addressData.state}, Brazil`;
                url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

                response = await fetch(url, {
                    headers: { 'User-Agent': 'SevenOutlet/1.0' }
                });
                data = await response.json();

                if (data && data.length > 0) {
                    console.log(`[Lalamove] Coords found for Address ${query}:`, data[0].lat, data[0].lon);
                    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
                }
            }

            console.warn(`[Lalamove] Coords NOT found for ${cep}`);
            return null;
        } catch (error) {
            console.error('Error fetching coordinates:', error);
            return null;
        }
    }

    // Helper: Haversine Formula for Distance (KM)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    async getAddressByCep(cep) {
        try {
            // 1. Try ViaCEP
            let response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            let data = await response.json();

            if (!data.erro) {
                return {
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf,
                    cep: data.cep
                };
            }

            // 2. Fallback: Try BrasilAPI
            console.log(`[CEP] ViaCEP failed for ${cep}, trying BrasilAPI...`);
            response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
            data = await response.json();

            if (data.cep) {
                return {
                    street: data.street,
                    neighborhood: data.neighborhood,
                    city: data.city,
                    state: data.state,
                    cep: data.cep
                };
            }

            return null;
        } catch (e) {
            console.error('Error fetching CEP:', e);
            // Try BrasilAPI on catch as well
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
                const data = await response.json();
                if (data.cep) {
                    return {
                        street: data.street,
                        neighborhood: data.neighborhood,
                        city: data.city,
                        state: data.state,
                        cep: data.cep
                    };
                }
            } catch (err) {
                console.error('Error fetching CEP (fallback):', err);
            }
            return null;
        }
    }
}

class AuthService {
    constructor() {
        this.client = window.supabaseClient;
    }

    async login(email, password) {
        if (!this.client) return { error: 'Supabase not initialized' };
        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });
        if (error) return { error: error.message };
        return { user: data.user, session: data.session };
    }

    async register(data) {
        if (!this.client) return { error: 'Supabase not initialized' };
        // data: { name, email, password, phone, ... }
        const { data: authData, error } = await this.client.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    full_name: data.name,
                    phone: data.phone
                }
            }
        });

        if (error) return { error: error.message };

        if (authData.user) {
            const { error: profileError } = await this.client
                .from('profiles')
                .upsert([{
                    id: authData.user.id,
                    full_name: data.name,
                    phone: data.phone
                }], { onConflict: 'id' });

            if (profileError) {
                console.error('Error creating profile:', profileError);
            }
        }

        return { user: authData.user, session: authData.session };
    }

    async recoverPassword(email) {
        if (!this.client) return { error: 'Supabase not initialized' };
        const { error } = await this.client.auth.resetPasswordForEmail(email);
        if (error) return { error: error.message };
        return { success: true };
    }

    async logout() {
        if (!this.client) return;
        const { error } = await this.client.auth.signOut();
        if (error) console.error('Error signing out:', error);
        window.location.href = 'index.html';
    }

    async getCurrentUser() {
        if (!this.client) return null;
        const { data: { user } } = await this.client.auth.getUser();
        return user;
    }

    async updateProfile(data) {
        if (!this.client) return { error: 'Supabase not initialized' };
        const user = await this.getCurrentUser();
        if (!user) return { error: 'Not logged in' };

        const { error } = await this.client
            .from('profiles')
            .update(data)
            .eq('id', user.id);

        if (error) return { error: error.message };
        return { success: true };
    }

    // --- MFA Methods (2FA) ---

    // 1. Enroll (Start Setup)
    async enrollMFA() {
        if (!this.client) return { error: 'Supabase not initialized' };

        try {
            const { data, error } = await this.client.auth.mfa.enroll({
                factorType: 'totp'
            });

            if (error) return { error: error.message };

            // Correct Supabase structure: data.totp contains details
            const totp = data.totp || data;

            return {
                id: data.id,
                secret: totp.secret,
                qr_code: totp.qr_code
            };
        } catch (err) {
            console.error('MFA Enroll Error:', err);
            return { error: 'Erro ao iniciar configuração 2FA' };
        }
    }

    // 2. Challenge
    async challengeMFA(factorId) {
        if (!this.client) return { error: 'Supabase not initialized' };

        const { data, error } = await this.client.auth.mfa.challenge({ factorId });
        if (error) return { error: error.message };

        return { id: data.id, expires_at: data.expires_at };
    }

    // 3. Verify
    async verifyMFA(factorId, challengeId, code) {
        if (!this.client) return { error: 'Supabase not initialized' };

        const { data, error } = await this.client.auth.mfa.verify({
            factorId,
            challengeId,
            code
        });

        if (error) return { error: error.message };
        return { success: true, data };
    }

    // 4. Helper: Challenge + Verify
    async challengeAndVerifyMFA(factorId, code) {
        const challengeRes = await this.challengeMFA(factorId);
        if (challengeRes.error) return challengeRes;

        return await this.verifyMFA(factorId, challengeRes.id, code);
    }

    // 5. Get Assurance Level
    async getAssuranceLevel() {
        if (!this.client) return null;
        const { data, error } = await this.client.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) return null;
        return data;
    }

    // 6. List Factors
    async listFactors() {
        if (!this.client) return [];
        const { data, error } = await this.client.auth.mfa.listFactors();
        if (error) return [];
        return data.totp || [];
    }

    // 7. Unenroll
    async unenrollMFA(factorId) {
        if (!this.client) return { error: 'Supabase not initialized' };
        const { data, error } = await this.client.auth.mfa.unenroll({ factorId });
        if (error) return { error: error.message };
        return { success: true };
    }
}

const freightService = new FreightService();
const authService = new AuthService();

window.freightService = freightService;
window.authService = authService;
