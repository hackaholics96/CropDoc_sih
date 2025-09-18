// routes/weather.js
import express from 'express';
import { generateWeatherAlerts } from '../lib/weatherAlerts.js';

const router = express.Router();

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Simple rate limiting
const rateLimit = new Map();
const RATE_LIMIT = 20; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

/**
 * Fetches weather data from Open-Meteo API
 */
async function fetchWeatherData(lat, lng, hours = 48) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relativehumidity_2m,precipitation,windspeed_10m&forecast_days=3`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Middleware for basic rate limiting
 */
function checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Clean up old entries
    const recentRequests = (rateLimit.get(ip) || []).filter(time => time > windowStart);
    
    if (recentRequests.length >= RATE_LIMIT) {
        return false;
    }
    
    recentRequests.push(now);
    rateLimit.set(ip, recentRequests);
    return true;
}

router.get('/', async (req, res) => {
    const { lat, lng, hours = 48 } = req.query;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Validation
    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
    }
    
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const hoursNum = parseInt(hours);
    
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        return res.status(400).json({ error: 'Invalid latitude or longitude values' });
    }
    
    if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 168) {
        return res.status(400).json({ error: 'Hours parameter must be between 1 and 168' });
    }
    
    // Rate limiting
    if (!checkRateLimit(clientIP)) {
        return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
    }
    
    // Check cache
    const cacheKey = `${lat},${lng},${hours}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return res.json(cached.data);
    }
    
    try {
        // Fetch weather data from Open-Meteo
        const weatherData = await fetchWeatherData(latNum, lngNum, hoursNum);
        
        // Normalize the data structure for the alert engine
        const normalizedData = weatherData.hourly.time.map((time, index) => ({
            time: time,
            temperature: weatherData.hourly.temperature_2m[index],
            precipitation: weatherData.hourly.precipitation[index],
            windSpeed: weatherData.hourly.windspeed_10m[index],
            relativeHumidity: weatherData.hourly.relativehumidity_2m[index]
        }));

        // Generate alerts
        const alerts = generateWeatherAlerts(normalizedData);

        // Prepare response
        const responseData = {
            latitude: weatherData.latitude,
            longitude: weatherData.longitude,
            elevation: weatherData.elevation,
            hourly: weatherData.hourly,
            alerts: alerts,
            generated_at: new Date().toISOString(),
            cache_hit: false
        };

        // Update cache
        cache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        res.json(responseData);

    } catch (error) {
        console.error('Weather API error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch weather data', 
            details: error.message 
        });
    }
});

export default router; // Changed from module.exports