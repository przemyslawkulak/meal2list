import { AppEnvironment } from '../app/app.config';

export const environment: AppEnvironment = {
  production: true,
  supabaseUrl: '${SUPABASE_URL}',
  supabaseKey: '${SUPABASE_KEY}',
};
