import { Injectable, Inject } from '@angular/core';
import { AuthChangeEvent, AuthSession, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '@db/database.types';
import { AppEnvironment } from '@app/app.config';
import { from, Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { supabaseClient } from '@db/supabase.client';
import { inject } from '@angular/core';
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';
import { HttpErrorResponse } from '@angular/common/http';

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
  protected readonly notification = inject(NotificationService);
  protected readonly logger = inject(LoggerService);

  constructor(@Inject('APP_ENVIRONMENT') private environment: AppEnvironment) {
    this.supabase = supabaseClient;
  }

  getUserId(): Observable<string> {
    return from(this.supabase.auth.getSession()).pipe(
      map(({ data: { session }, error }) => {
        if (error) {
          throw new Error(`Session error: ${error.message}`);
        }
        if (!session?.user) {
          throw new Error('User ID not available');
        }
        return session.user.id;
      })
    );
  }

  async getUsers() {
    return this.supabase.from('profiles').select('*');
  }

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

  protected handleServiceError<T = never>(
    error: HttpErrorResponse,
    fallbackMessage: string
  ): Observable<T> {
    this.logger.logError(error, fallbackMessage);
    this.notification.showError(fallbackMessage);
    return throwError(() => error);
  }
}
