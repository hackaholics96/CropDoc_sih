// testJoins.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Normal anon client (like frontend uses)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  console.log('\n=== 1) Farms with owners ===');
  let { data, error } = await supabase
    .from('farms')
    .select(`
      id, name, area, soil_type, created_at,
      users ( id, name, phone )
    `);
  if (error) console.error(error);
  else console.table(data);

  console.log('\n=== 2) Crops with farms + owners ===');
  ({ data, error } = await supabase
    .from('crop_records')
    .select(`
      id, crop_name, season, planted_on, expected_harvest_on,
      farms (
        id, name,
        users ( id, name )
      )
    `));
  if (error) console.error(error);
  else console.dir(data, { depth: null });

  console.log('\n=== 3) Recommendations with crops/farms/users ===');
  ({ data, error } = await supabase
    .from('recommendations')
    .select(`
      id, title, message, severity, created_at,
      crop_records (
        crop_name,
        farms (
          name,
          users ( name )
        )
      )
    `));
  if (error) console.error(error);
  else console.dir(data, { depth: null });
}

run();
