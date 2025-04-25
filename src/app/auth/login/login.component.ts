import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loading = false;
  hidePassword = true;
  signInForm: FormGroup;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router
  ) {
    this.signInForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.signInForm.invalid) {
      return;
    }

    try {
      this.loading = true;
      const { email, password } = this.signInForm.value;
      const { error } = await this.supabase.signInWithPassword(email, password);

      if (error) throw error;

      // Redirect to home page or dashboard after successful login
      await this.router.navigate(['/generate']);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      this.loading = false;
    }
  }
}
