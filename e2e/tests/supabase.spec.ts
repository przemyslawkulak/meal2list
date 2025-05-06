import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

setup('configure Supabase', async () => {
  // Create Supabase client with online credentials
  const supabase = createClient(
    process.env['SUPABASE_URL'] || '',
    process.env['SUPABASE_KEY'] || ''
  );

  // You can add any additional Supabase setup here
  // For example, creating test data or signing in a test user

  if (process.env['TEST_USER_EMAIL'] && process.env['TEST_USER_PASSWORD']) {
    const { error } = await supabase.auth.signInWithPassword({
      email: process.env['TEST_USER_EMAIL'],
      password: process.env['TEST_USER_PASSWORD'],
    });

    if (error) {
      console.error('Error signing in test user:', error.message);
      throw error;
    }
  }
});
