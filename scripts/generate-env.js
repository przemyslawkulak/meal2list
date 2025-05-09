/* eslint-env node */
const fs = require('fs');

const content = `
import { AppEnvironment } from '../app/app.config';

export const environment: AppEnvironment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_KEY}',
};
`;

fs.writeFileSync('src/environments/environment.ts', content);
console.log('Generated src/environments/environment.ts');
