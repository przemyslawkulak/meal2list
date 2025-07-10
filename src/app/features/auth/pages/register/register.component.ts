import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/supabase/auth.service';
import {
  PASSWORD_PATTERN,
  SPINNER_DIAMETER,
} from '@app/shared/constants/form-validation.constants';
import { User } from '@supabase/supabase-js';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '@app/shared/services/notification.service';
import { LoggerService } from '@app/shared/services/logger.service';

@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  readonly spinnerDiameter = SPINNER_DIAMETER;
  registerForm: FormGroup;
  loading = false;
  private readonly notification = inject(NotificationService);
  private readonly logger = inject(LoggerService);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [Validators.required, Validators.minLength(8), Validators.pattern(PASSWORD_PATTERN)],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      const { email, password } = this.registerForm.value;

      this.signUp(email, password)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: () => {
            this.notification.showSuccess(
              'Rejestracja zakończona powodzeniem. Możesz się teraz zalogować.'
            );
            this.router.navigate(['/auth/login']);
          },
          error: error => {
            this.logger.logError(error, 'Registration error');
            this.notification.showError(this.getErrorMessage(error));
          },
        });
    }
  }

  private signUp(email: string, password: string): Observable<User> {
    // Use the signUp method from AuthService
    return this.authService.signUp(email, password);
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error?.message) {
      switch (error.message) {
        case 'User already registered':
          return 'Email jest już zarejestrowany';
        case 'Password should be at least 8 characters':
          return 'Hasło musi mieć co najmniej 8 znaków';
        default:
          return error.message;
      }
    }
    return 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';
  }
}
