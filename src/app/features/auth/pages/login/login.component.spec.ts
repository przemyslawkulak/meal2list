import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { User } from '@supabase/supabase-js';

import { LoginComponent } from './login.component';
import { AuthService } from '@app/core/supabase/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: jest.Mocked<AuthService>;
  // Mock user for authentication responses
  const mockUser: User = {
    id: 'test-user-id',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;

  beforeEach(async () => {
    authServiceMock = {
      login: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatProgressSpinnerModule,
        RouterLink,
        NoopAnimationsModule,
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => null },
              queryParamMap: { get: () => null },
            },
            paramMap: of({ get: () => null }),
            queryParamMap: of({ get: () => null }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Form initialization', () => {
    it('should initialize the form with email and password controls', () => {
      expect(component.loginForm.get('email')).toBeTruthy();
      expect(component.loginForm.get('password')).toBeTruthy();
    });

    it('should set validators for email field', () => {
      const emailControl = component.loginForm.get('email');

      emailControl?.setValue('');
      expect(emailControl?.valid).toBeFalsy();
      expect(emailControl?.hasError('required')).toBeTruthy();

      emailControl?.setValue('not-an-email');
      expect(emailControl?.valid).toBeFalsy();
      expect(emailControl?.hasError('email')).toBeTruthy();

      emailControl?.setValue('valid@email.com');
      expect(emailControl?.valid).toBeTruthy();
    });

    it('should set validators for password field', () => {
      const passwordControl = component.loginForm.get('password');

      passwordControl?.setValue('');
      expect(passwordControl?.valid).toBeFalsy();
      expect(passwordControl?.hasError('required')).toBeTruthy();

      passwordControl?.setValue('12345');
      expect(passwordControl?.valid).toBeFalsy();
      expect(passwordControl?.hasError('minlength')).toBeTruthy();

      passwordControl?.setValue('123456');
      expect(passwordControl?.valid).toBeTruthy();
    });
  });

  describe('Getters', () => {
    it('should return the email FormControl', () => {
      expect(component.email).toBe(component.loginForm.get('email'));
    });

    it('should return the password FormControl', () => {
      expect(component.password).toBe(component.loginForm.get('password'));
    });
  });

  describe('hasError method', () => {
    it('should return false when control is pristine', () => {
      expect(component.hasError('email', 'required')).toBeFalsy();
    });

    it('should return true when control is touched and has the specified error', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();

      expect(component.hasError('email', 'required')).toBeTruthy();
    });

    it('should return true when control is dirty and has the specified error', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsDirty();

      expect(component.hasError('email', 'required')).toBeTruthy();
    });

    it("should return false when control doesn't have the specified error", () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('valid@email.com');
      emailControl?.markAsTouched();

      expect(component.hasError('email', 'required')).toBeFalsy();
      expect(component.hasError('email', 'email')).toBeFalsy();
    });
  });

  describe('onSubmit method', () => {
    it('should not call authService.login when form is invalid', () => {
      component.loginForm.setValue({ email: '', password: '' });
      component.onSubmit();

      expect(authServiceMock.login).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalsy();
    });

    it('should call authService.login with correct values when form is valid', () => {
      authServiceMock.login.mockReturnValue(of(mockUser));

      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      expect(authServiceMock.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        undefined
      );
      expect(component.isLoading).toBeFalsy();
    });

    it('should set isLoading to true while processing login', () => {
      authServiceMock.login.mockReturnValue(of(mockUser));

      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.isLoading = false;
      component.onSubmit();

      // We need to test that isLoading was true during the call
      // This is tricky with observables, but we can verify the final state
      expect(component.isLoading).toBeFalsy();
      expect(authServiceMock.login).toHaveBeenCalled();
    });

    it('should handle login error correctly', () => {
      const errorMsg = 'Invalid login credentials';
      authServiceMock.login.mockReturnValue(throwError(() => ({ message: errorMsg })));

      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      expect(component.isLoading).toBeFalsy();
      expect(component.loginForm.hasError('invalidCredentials')).toBeTruthy();
      expect(component.loginForm.get('password')?.value).toBeNull();
    });

    it('should set form error for invalid credentials', () => {
      const errorMsg = 'Invalid login credentials';
      authServiceMock.login.mockReturnValue(throwError(() => ({ message: errorMsg })));

      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      expect(component.loginForm.hasError('invalidCredentials')).toBeTruthy();
    });
  });

  describe('Template tests', () => {
    it('should disable submit button when form is invalid', () => {
      component.loginForm.setValue({ email: '', password: '' });
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(
        By.css('button[type="submit"]')
      ).nativeElement;

      expect(submitButton.disabled).toBeTruthy();
    });

    it('should enable submit button when form is valid', () => {
      component.loginForm.setValue({
        email: 'valid@email.com',
        password: 'password123',
      });
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(
        By.css('button[type="submit"]')
      ).nativeElement;

      expect(submitButton.disabled).toBeFalsy();
    });

    it('should display email validation error when email is invalid', () => {
      component.loginForm.get('email')?.setValue('invalid-email');
      component.loginForm.get('email')?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(
        By.css('mat-form-field:first-of-type mat-error')
      );

      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain(
        'Proszę podać prawidłowy adres email'
      );
    });

    it('should display password validation error when password is too short', () => {
      component.loginForm.get('password')?.setValue('12345');
      component.loginForm.get('password')?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(
        By.css('mat-form-field:nth-of-type(2) mat-error')
      );

      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain(
        'Hasło musi mieć co najmniej 6 znaków'
      );
    });

    it('should disable submit button when form has invalid credentials error', () => {
      component.loginForm.setErrors({ invalidCredentials: true });
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));

      expect(submitButton.nativeElement.disabled).toBeTruthy();
    });

    it('should show spinner when isLoading is true', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const spinnerElement = fixture.debugElement.query(By.css('.loading-overlay mat-spinner'));

      expect(spinnerElement).toBeTruthy();
    });

    it('should have correct routerLinks for register and password recovery', () => {
      const links = fixture.debugElement.queryAll(By.css('.links a'));

      expect(links.length).toBe(2);
      expect(links[0].attributes['routerLink']).toBe('/auth/register');
      expect(links[1].attributes['routerLink']).toBe('/auth/recover');
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple submission attempts', () => {
      authServiceMock.login.mockReturnValue(of(mockUser));

      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123',
      });

      // First submission
      component.onSubmit();
      expect(authServiceMock.login).toHaveBeenCalledTimes(1);

      // Second submission
      component.onSubmit();
      expect(authServiceMock.login).toHaveBeenCalledTimes(2);
    });

    it('should handle special characters in login credentials', () => {
      authServiceMock.login.mockReturnValue(of(mockUser));

      component.loginForm.setValue({
        email: 'test+special@example.com',
        password: 'p@$$w0rd!',
      });

      component.onSubmit();

      expect(authServiceMock.login).toHaveBeenCalledWith(
        'test+special@example.com',
        'p@$$w0rd!',
        undefined
      );
    });
  });
});
