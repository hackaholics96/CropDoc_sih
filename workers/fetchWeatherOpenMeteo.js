// workers/fetchWeatherOpenMete.js
import 'dotenv/config';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Fetch hourly forecast from Open-Meteo and insert into weather_data table.
 * Open-Meteo docs: https://open-meteo.com/
 */
async function fetchAndStore(lat, lng, farmId) {
  if (lat == null || lng == null) {
    console.warn('skip, missing coords for farm', farmId);
    return;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relativehumidity_2m,precipitation,windspeed_10m,winddirection_10m&forecast_days=2&timezone=UTC`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo error ${res.status}`);
  }
  const payload = await res.json();

  const hourly = payload.hourly;
  if (!hourly || !hourly.time) {
    console.warn('no hourly payload for', farmId);
    return;
  }

  // Build rows (one row per hourly timestamp)
  const rows = hourly.time.map((t, i) => ({
    farm_id: farmId,
    lat,
    lng,
    provider: 'open-meteo',
    data_type: 'hourly_forecast',
    target_time: new Date(t).toISOString(),
    temp: hourly.temperature_2m?.[i] ?? null,
    humidity: hourly.relativehumidity_2m?.[i] ?? null,
    precip: hourly.precipitation?.[i] ?? null,
    wind_speed: hourly.windspeed_10m?.[i] ?? null,
    wind_dir: hourly.winddirection_10m?.[i] ?? null,
    raw: payload
  }));

  // Insert in chunks to avoid large single inserts
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from('weather_data').insert(chunk);
    if (error) {
      console.error('insert chunk error for farm', farmId, error);
      // don't throw here; continue with next chunk
    }
  }

  console.log(`Stored ${rows.length} hourly rows for farm ${farmId}`);
}

/**
 * Fetch for all farms that have lat/lng
 */
async function runAllFarms() {
  const { data: farms, error } = await supabase
    .from('farms')
    .select('id,lat,lng')
    .not('lat','is',null)
    .not('lng','is',null);

  if (error) {
    console.error('error fetching farms', error);
    return;
  }
  console.log(`Found ${farms.length} farms with coords`);

  for (const f of farms) {
    try {
      // lat/lng might be stored as strings — convert to Number
      const lat = Number(f.lat);
      const lng = Number(f.lng);
      await fetchAndStore(lat, lng, f.id);
      // small sleep to avoid aggressive spamming if many farms
      await new Promise(r => setTimeout(r, 300)); // 300ms
    } catch (err) {
      console.error('error for farm', f.id, err.message);
    }
  }
}

if (require.main === module) {
  runAllFarms().catch(err => {
    console.error('worker failed', err);
    process.exit(1);
  });
}

export { fetchAndStore, runAllFarms };
