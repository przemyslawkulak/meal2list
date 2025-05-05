export interface AppEnvironment {
  production: boolean;
  supabaseUrl: string;
  supabaseKey: string;
}

export const mockEnvironment: AppEnvironment = {
  production: false,
  supabaseUrl: 'https://mock-supabase-url.com',
  supabaseKey: 'mock-supabase-key',
};
