import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { AuthService } from '@app/core/supabase/auth.service';
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    RouterLink,
  ],
  templateUrl: './recover.component.html',
  styleUrls: ['./recover.component.scss'],
})
export class PasswordRecoveryComponent {
  recoveryForm: FormGroup;
  loading = signal(false);
  submitted = signal(false);

  private readonly notification = inject(NotificationService);
  private readonly logger = inject(LoggerService);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.recoveryForm.valid && !this.submitted()) {
      this.loading.set(true);
      const { email } = this.recoveryForm.value;

      this.authService
        .resetPassword(email)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.submitted.set(true);
            this.loading.set(false);
            this.notification.showSuccess(
              'Link do resetowania hasła został wysłany na podany adres email.'
            );
          },
          error: error => {
            this.loading.set(false);
            this.logger.logError(error, 'Password recovery error');
            this.notification.showError(
              'Wystąpił błąd podczas wysyłania linku resetującego hasło.'
            );
          },
        });
    }
  }
}
