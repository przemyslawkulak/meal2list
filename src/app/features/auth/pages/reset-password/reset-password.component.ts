import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/supabase/auth.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  loading = signal(false);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetForm = this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit() {
    // Check if we have the token in the URL
    const fragment = this.route.snapshot.fragment;
    if (!fragment?.includes('access_token=')) {
      this.snackBar.open('Nieprawidłowy link resetowania hasła.', 'OK', { duration: 5000 });
      this.router.navigate(['/auth/recover']);
      return;
    }

    // Let Supabase client handle the token
    this.authService.handleResetToken(fragment).subscribe({
      error: () => {
        this.snackBar.open('Link resetowania hasła wygasł lub jest nieprawidłowy.', 'OK', {
          duration: 5000,
        });
        this.router.navigate(['/auth/recover']);
      },
    });
  }

  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      this.loading.set(true);
      const { password } = this.resetForm.value;

      this.authService
        .updatePassword(password)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.loading.set(false);
            this.snackBar.open('Hasło zostało pomyślnie zmienione.', 'OK', { duration: 5000 });
            this.router.navigate(['/auth/login']);
          },
          error: (error: unknown) => {
            this.loading.set(false);
            this.snackBar.open('Wystąpił błąd podczas zmiany hasła.', 'OK', { duration: 5000 });
            console.error('Password reset error:', error);
          },
        });
    }
  }
}
