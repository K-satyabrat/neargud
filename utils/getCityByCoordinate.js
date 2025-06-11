const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const Bottleneck = require('bottleneck');

const CACHE_FILE = path.join(__dirname, '../cacheFiles/city_cache.json');
let cache = new Map();

async function loadCache() {
    try {
        const data = await fs.readFile(CACHE_FILE, 'utf8');
        cache = new Map(Object.entries(JSON.parse(data)));
        console.log('City cache loaded');
    } catch (error) {
        console.log('No city cache or error:', error.message);
    }
}

async function saveCache() {
    try {
        await fs.writeFile(CACHE_FILE, JSON.stringify(Object.fromEntries(cache), null, 2));
        console.log('City cache saved');
    } catch (error) {
        console.error('Error saving city cache:', error.message);
    }
}

// Load the cache asynchronously without blocking server startup
loadCache().catch((error) => {
    console.error('Failed to load city cache:', error.message);
});

const limiter = new Bottleneck({
    minTime: 1000,
    maxConcurrent: 1,
});

const limitedGet = limiter.wrap(axios.get);

const getCityByCoordinates = async (latitude, longitude) => {
    const cacheKey = `${latitude}:${longitude}`;
    if (cache.has(cacheKey)) {
        console.log(`City cache hit for ${cacheKey}`);
        console.log('city:', cache.get(cacheKey));
        return cache.get(cacheKey);
    }

    try {
        console.log(`Making city API request for ${cacheKey}`);
        const response = await limitedGet('https://nominatim.openstreetmap.org/reverse', {
            params: {
                lat: latitude,
                lon: longitude,
                format: 'json',
                zoom: 10,
            },
            headers: {
                'User-Agent': 'NearGudApp/1.0 (contact: your-email@example.com)',
                'Referer': 'https://your-app-website.com',
            },
        });

        const { address } = response.data;
        const city = address.city || address.town || address.village || address.county || 'Unknown';

        cache.set(cacheKey, city);
        await saveCache();
        console.log('city:', city);
        return city;
    } catch (error) {
        const errorMessage = error.response?.data || error.message;
        console.error('Error fetching city:', errorMessage);
        if (errorMessage.includes('Bandwidth limit exceeded') || error.response?.status === 429) {
            console.error(
                'Nominatim API bandwidth limit exceeded. Wait for the block to lift.'
            );
            return null;
        }
        console.error('Failed to fetch city');
        return null;
    }
};

module.exports = getCityByCoordinates;