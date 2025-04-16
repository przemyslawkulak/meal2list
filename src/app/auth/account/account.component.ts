import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthSession } from '@supabase/supabase-js';
import { Profile, SupabaseService } from '../../core/supabase/supabase.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit {
  @Input() session!: AuthSession;
  loading = false;
  profile: Profile | null = null;
  avatarUrl: string | null = null;
  updateProfileForm: FormGroup;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly formBuilder: FormBuilder
  ) {
    this.updateProfileForm = this.formBuilder.group({
      username: [''],
      website: [''],
      avatar_url: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.getProfile();

    const { username, website, avatar_url } = this.profile || {};
    this.updateProfileForm.patchValue({
      username,
      website,
      avatar_url,
    });

    if (avatar_url) {
      const {
        data: { publicUrl },
      } = this.supabase.getPublicUrl(avatar_url);
      this.avatarUrl = publicUrl;
    }
  }

  async getProfile() {
    try {
      this.loading = true;
      const { user } = this.session;
      const { data: profile, error, status } = await this.supabase.getProfile(user);
      console.log(profile);

      if (error && status !== 406) {
        throw error;
      }

      if (profile) {
        this.profile = profile;
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      this.loading = false;
    }
  }

  async updateProfile(): Promise<void> {
    try {
      this.loading = true;
      const { user } = this.session;

      const updates = {
        id: user.id,
        ...this.updateProfileForm.value,
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.supabase.updateProfile(updates);
      if (error) throw error;
      alert('Profile updated!');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      this.loading = false;
    }
  }

  async uploadAvatar(event: Event) {
    try {
      this.loading = true;
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        throw new Error('No file selected');
      }
      const fileExt = file.name.split('.').pop();
      const filePath = `${this.session.user.id}-${Math.random()}.${fileExt}`;

      await this.supabase.uploadAvatar(filePath, file);

      this.updateProfileForm.patchValue({
        avatar_url: filePath,
      });

      await this.updateProfile();

      const {
        data: { publicUrl },
      } = this.supabase.getPublicUrl(filePath);
      this.avatarUrl = publicUrl;
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      this.loading = false;
    }
  }

  async signOut() {
    try {
      this.loading = true;
      await this.supabase.signOut();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      this.loading = false;
    }
  }
}
