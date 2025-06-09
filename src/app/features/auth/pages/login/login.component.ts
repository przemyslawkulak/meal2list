import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '@app/core/supabase/auth.service';

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
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  authError: string | null = null;
  private returnUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Get return URL from query params
    this.returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || null;
    console.log('LoginComponent: returnUrl from query params:', this.returnUrl);
  }

  get email() {
    return this.loginForm.get('email');
  }
  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.authError = null;
      const { email, password } = this.loginForm.value;

      console.log('LoginComponent: Calling login with returnUrl:', this.returnUrl);
      this.authService.login(email, password, this.returnUrl || undefined).subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: error => {
          this.isLoading = false;
          this.authError = error.message;
          this.loginForm.get('password')?.reset();
          if (error.message === 'Invalid login credentials') {
            this.loginForm.setErrors({ invalidCredentials: true });
          }
        },
      });
    }
  }

  hasError(field: string, error: string): boolean {
    const control = this.loginForm.get(field);
    return control ? control.hasError(error) && (control.dirty || control.touched) : false;
  }
}
