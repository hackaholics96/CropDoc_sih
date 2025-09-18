// testOtpFlow.js (ESM)
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Edit these to match your test mapping in Supabase (no leading +)
const TEST_PHONE = '918870830410'; // example
const TEST_CODE  = '123456';       // must match the mapping you saved in Supabase

async function run() {
  console.log('Requesting OTP for', TEST_PHONE);
  const { data: sendData, error: sendError } = await supabase.auth.signInWithOtp({
    phone: TEST_PHONE
  });
  if (sendError) {
    console.error('sendOtp error:', sendError);
    return;
  }
  console.log('sendOtp response (should be ok for test mapping):', sendData);

  // Now verify using the mapped code
  console.log('Verifying OTP with code', TEST_CODE);
  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    phone: TEST_PHONE,
    token: TEST_CODE,
    type: 'sms'
  });
  if (verifyError) {
    console.error('verifyOtp error:', verifyError);
    return;
  }
  console.log('verifyOtp success. session:', verifyData.session);

  // fetch the auth user and public.users row
  const user = verifyData?.session?.user;
  console.log('auth user id:', user?.id);

  // Query public.users using anon client (RLS will restrict; if logged-in, we can use the session)
  // Set the session inside client:
  if (verifyData.session) {
    await supabase.auth.setSession(verifyData.session);
  }

  const { data: pubUser, error: pubErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id);

  if (pubErr) console.error('error fetching public.users:', pubErr);
  else console.log('public.users row:', pubUser);
}

run();
