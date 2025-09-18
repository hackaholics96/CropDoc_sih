import 'dotenv/config';    // make sure you have dotenv installed: npm install dotenv
import { supabase } from './lib/supabaseClient.js';

async function testConnection() {
  const { data, error } = await supabase
    .from('languages')
    .select('*')
    .limit(5);

  if (error) {
    console.error(' Supabase connection failed:', error);
  } else {
    console.log(' Supabase connected! Sample data:', data);
  }
}

testConnection();
