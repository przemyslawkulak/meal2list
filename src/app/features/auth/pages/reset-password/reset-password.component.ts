import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/supabase/auth.service';
import { take } from 'rxjs';
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';
import { HttpErrorResponse } from '@angular/common/http';

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

  private readonly notification = inject(NotificationService);
  private readonly logger = inject(LoggerService);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
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
      this.notification.showError('Nieprawidłowy link resetowania hasła.');
      this.router.navigate(['/auth/recover']);
      return;
    }

    // Let Supabase client handle the token
    this.authService.handleResetToken(fragment).subscribe({
      error: error => {
        this.logger.logError(error, 'Invalid reset token');
        this.notification.showError('Link resetowania hasła wygasł lub jest nieprawidłowy.');
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
            this.notification.showSuccess('Hasło zostało pomyślnie zmienione.');
            this.router.navigate(['/auth/login']);
          },
          error: (error: HttpErrorResponse) => {
            this.loading.set(false);
            this.logger.logError(error, 'Password reset error');
            this.notification.showError('Wystąpił błąd podczas zmiany hasła.');
          },
        });
    }
  }
}
