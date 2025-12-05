const https = require('https');

const CONFIG = {
    active: true,
    origin_cep: "01030-001",
    pricing_table: {
        "1": 10, "2": 2.5, "3": 2.5, "4": 2.5, "5": 2.5,
        "6": 2.5, "7": 2.5, "8": 2.5, "9": 2, "10": 2,
        "11": 2, "12": 2, "13": 2, "14": 2, "15": 2,
        "16": 1.5, "17": 1.5, "18": 1.5, "19": 1.5, "20": 1.3,
        "21": 1.3, "22": 1.3, "23": 1.3, "24": 1.3, "25": 1.3,
        "26": 1, "27": 1, "28": 1, "29": 1, "30": 1,
        "31": 1, "32": 1, "33": 1, "34": 1, "35": 1,
        "36": 1, "37": 1, "38": 1, "39": 1, "40": 1,
        "41": 1, "42": 1, "43": 1, "44": 1, "45": 1,
        "46": 1, "47": 1, "48": 1, "49": 1, "50": 1
    }
};

const TEST_CEPS = [
    { cep: "01310-100", name: "Av Paulista" },
    { cep: "05425-902", name: "Pinheiros" },
    { cep: "04538-133", name: "Itaim Bibi" },
    { cep: "02011-200", name: "Santana" },
    { cep: "03001-000", name: "Brás" },
    { cep: "04001-001", name: "Vila Mariana" },
    { cep: "05001-100", name: "Perdizes" },
    { cep: "03178-200", name: "Mooca" },
    { cep: "04707-910", name: "Brooklin" },
    { cep: "08246-101", name: "Itaquera (User Reported)" }
];

function getCoordinates(cep) {
    return new Promise((resolve, reject) => {
        const cleanCep = cep.replace(/\D/g, '');
        const url = `https://nominatim.openstreetmap.org/search?postalcode=${cleanCep}&country=Brazil&format=json&limit=1`;

        const options = {
            headers: { 'User-Agent': 'SevenOutletDebug/1.0' }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json && json.length > 0) {
                        resolve({ lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', (e) => resolve(null));
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function run() {
    console.log('--- Starting Simulation ---');

    const originCoords = await getCoordinates(CONFIG.origin_cep);
    if (!originCoords) {
        console.error(`Failed to get Origin Coordinates for ${CONFIG.origin_cep}`);
        return;
    }
    console.log(`Origin: ${CONFIG.origin_cep} (${originCoords.lat}, ${originCoords.lon})`);

    for (const test of TEST_CEPS) {
        // Delay to be nice to Nominatim
        await new Promise(r => setTimeout(r, 1500));

        const destCoords = await getCoordinates(test.cep);
        if (!destCoords) {
            console.error(`[FAIL] ${test.cep} - ${test.name}: Failed to get coordinates`);
            continue;
        }

        const distance = calculateDistance(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);

        let totalPrice = 0;
        const maxKm = Math.ceil(distance);

        for (let i = 1; i <= maxKm; i++) {
            const kmKey = i.toString();
            let kmPrice = 0;
            if (CONFIG.pricing_table[kmKey]) {
                kmPrice = parseFloat(CONFIG.pricing_table[kmKey]);
            } else {
                const keys = Object.keys(CONFIG.pricing_table).map(k => parseInt(k)).sort((a, b) => a - b);
                const lastKey = keys[keys.length - 1];
                if (lastKey && i > lastKey) {
                    kmPrice = parseFloat(CONFIG.pricing_table[lastKey.toString()]);
                }
            }
            totalPrice += kmPrice;
        }

        console.log(`[OK] ${test.cep} - ${test.name} | Dist: ${distance.toFixed(2)} km | Price: R$ ${totalPrice.toFixed(2)}`);
    }
}

run();
