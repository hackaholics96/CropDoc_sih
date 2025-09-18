// server/index.js
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(bodyParser.json());

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Simple health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Note: this endpoint uses the service role client but still verifies ownership via auth token.
// If you don't want to require a token for prototyping, remove auth checks (not recommended for prod).
async function getUserFromToken(token) {
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) {
    console.warn('getUserFromToken error', error);
    return null;
  }
  return data?.user ?? null;
}

// GET /api/farms/:id/weather?hours=48
app.get('/api/farms/:id/weather', async (req, res) => {
  try {
    const farmId = req.params.id;
    const hours = Number(req.query.hours || 48);

    // Optional: verify token and ownership
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const user = token ? await getUserFromToken(token) : null;

    // Fetch farm and check ownership if token provided
    const { data: farm, error: fErr } = await supabaseAdmin
      .from('farms')
      .select('user_id,lat,lng')
      .eq('id', farmId)
      .single();

    if (fErr || !farm) return res.status(404).json({ error: 'Farm not found' });
    if (user && farm.user_id !== user.id) return res.status(403).json({ error: 'Not owner of farm' });

    const from = new Date().toISOString();
    const to = new Date(Date.now() + hours * 3600 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('weather_data')
      .select('*')
      .eq('farm_id', farmId)
      .gte('target_time', from)
      .lte('target_time', to)
      .order('target_time', { ascending: true });

    if (error) return res.status(500).json({ error });

    res.json({ farm: { id: farmId, lat: farm.lat, lng: farm.lng }, weather: data });
  } catch (err) {
    console.error('endpoint error', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Weather API server listening on ${PORT}`));
