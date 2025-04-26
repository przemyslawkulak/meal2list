import { Injectable, Inject } from '@angular/core';
import {
  AuthChangeEvent,
  AuthSession,
  Session,
  SupabaseClient,
  User,
  createClient,
} from '@supabase/supabase-js';
import { Database } from '../../../db/database.types';
import { AppEnvironment } from '../../app.config';

export interface Profile {
  id?: string;
  username: string | null;
  website: string | null;
  avatar_url: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  protected supabase: SupabaseClient<Database>;
  private _session: AuthSession | null = null;

  constructor(@Inject('APP_ENVIRONMENT') private environment: AppEnvironment) {
    this.supabase = createClient<Database>(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }

  // ... existing code ...
  // Remove or replace the admin API call
  async getUsers() {
    return this.supabase.from('profiles').select('*');
  }
  // ... existing code ...

  async initializeUsers() {
    const { data, error } = await this.supabase.auth.admin.listUsers();
    console.log('data', data);
    return { data, error };
  }

  get session() {
    this.supabase.auth.getSession().then(({ data }) => {
      this._session = data.session;
    });
    return this._session;
  }

  // Auth methods
  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  signIn(email: string) {
    return this.supabase.auth.signInWithOtp({ email });
  }

  signInWithPassword(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  // Profile methods
  async getProfile(user: User) {
    return this.supabase
      .from('profiles')
      .select(`username, website, avatar_url`)
      .eq('id', user.id)
      .single();
  }

  async updateProfile(profile: Profile & { id: string }) {
    const update = {
      ...profile,
      updated_at: new Date().toISOString(),
    };
    return this.supabase.from('profiles').upsert(update);
  }

  // Storage methods
  async uploadAvatar(filePath: string, file: File) {
    const { error } = await this.supabase.storage.from('avatars').upload(filePath, file);
    if (error) throw error;
  }

  async downloadImage(path: string) {
    return this.supabase.storage.from('avatars').download(path);
  }

  getPublicUrl(path: string) {
    return this.supabase.storage.from('avatars').getPublicUrl(path);
  }
}
