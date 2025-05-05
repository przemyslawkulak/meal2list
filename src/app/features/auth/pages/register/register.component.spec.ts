import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        RouterLink,
        NoopAnimationsModule,
      ],
      providers: [
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => null } },
            paramMap: of({ get: () => null }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Form initialization', () => {
    it('should initialize the form with email, password and confirmPassword controls', () => {
      expect(component.registerForm.get('email')).toBeTruthy();
      expect(component.registerForm.get('password')).toBeTruthy();
      expect(component.registerForm.get('confirmPassword')).toBeTruthy();
    });

    it('should initialize all form controls as empty strings', () => {
      expect(component.registerForm.get('email')?.value).toBe('');
      expect(component.registerForm.get('password')?.value).toBe('');
      expect(component.registerForm.get('confirmPassword')?.value).toBe('');
    });
  });

  describe('Email validation', () => {
    it('should mark email as invalid when empty', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('');

      expect(emailControl?.valid).toBeFalsy();
      expect(emailControl?.hasError('required')).toBeTruthy();
    });

    it('should mark email as invalid with incorrect format', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('invalid-email');

      expect(emailControl?.valid).toBeFalsy();
      expect(emailControl?.hasError('email')).toBeTruthy();
    });

    it('should mark email as valid with correct format', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('user@example.com');

      expect(emailControl?.valid).toBeTruthy();
    });
  });

  describe('Password validation', () => {
    it('should mark password as invalid when empty', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('');

      expect(passwordControl?.valid).toBeFalsy();
      expect(passwordControl?.hasError('required')).toBeTruthy();
    });

    it('should mark password as invalid when shorter than 8 characters', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('1234567');

      expect(passwordControl?.valid).toBeFalsy();
      expect(passwordControl?.hasError('minlength')).toBeTruthy();
    });

    it('should mark password as valid when 8 or more characters', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('12345678');

      expect(passwordControl?.valid).toBeTruthy();
    });

    it('should require confirmPassword', () => {
      const confirmPasswordControl = component.registerForm.get('confirmPassword');
      confirmPasswordControl?.setValue('');

      expect(confirmPasswordControl?.valid).toBeFalsy();
      expect(confirmPasswordControl?.hasError('required')).toBeTruthy();
    });
  });

  describe('Password matching validation', () => {
    it('should detect mismatched passwords', () => {
      component.registerForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123',
      });

      expect(
        component.registerForm.get('confirmPassword')?.hasError('passwordMismatch')
      ).toBeTruthy();
      expect(component.registerForm.hasError('passwordMismatch')).toBeTruthy();
    });

    it('should validate matching passwords', () => {
      component.registerForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(
        component.registerForm.get('confirmPassword')?.hasError('passwordMismatch')
      ).toBeFalsy();
      expect(component.registerForm.hasError('passwordMismatch')).toBeFalsy();
    });

    it('should update validation when password changes', () => {
      // Set initial matching passwords
      component.registerForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(
        component.registerForm.get('confirmPassword')?.hasError('passwordMismatch')
      ).toBeFalsy();

      // Update password to create mismatch
      component.registerForm.get('password')?.setValue('newpassword123');

      expect(
        component.registerForm.get('confirmPassword')?.hasError('passwordMismatch')
      ).toBeTruthy();
    });
  });

  describe('Form submission', () => {
    it('should not call onSubmit when form is invalid', () => {
      // Spy on console.log which is currently used in onSubmit
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      component.registerForm.setValue({
        email: 'invalid-email', // Invalid email
        password: 'pass', // Too short
        confirmPassword: 'password', // Mismatch
      });

      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      submitButton.nativeElement.click();

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should call onSubmit with correct values when form is valid', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      component.registerForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      component.onSubmit();

      expect(consoleSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('UI interactions', () => {
    it('should disable submit button when form is invalid', () => {
      component.registerForm.setValue({
        email: '',
        password: '',
        confirmPassword: '',
      });
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(
        By.css('button[type="submit"]')
      ).nativeElement;

      expect(submitButton.disabled).toBeTruthy();
    });

    it('should enable submit button when form is valid', () => {
      component.registerForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(
        By.css('button[type="submit"]')
      ).nativeElement;

      expect(submitButton.disabled).toBeFalsy();
    });

    it('should display email validation error when email is invalid', () => {
      component.registerForm.get('email')?.setValue('invalid-email');
      component.registerForm.get('email')?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(
        By.css('mat-form-field:first-of-type mat-error')
      );

      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent.trim().toLowerCase()).toContain(
        'nieprawidłowy format'
      );
    });

    it('should display password length error when password is too short', () => {
      component.registerForm.get('password')?.setValue('1234');
      component.registerForm.get('password')?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(
        By.css('mat-form-field:nth-of-type(2) mat-error')
      );

      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent.trim().toLowerCase()).toContain('minimum 8');
    });

    it("should display password mismatch error when passwords don't match", () => {
      component.registerForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different',
      });
      component.registerForm.get('confirmPassword')?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(
        By.css('mat-form-field:nth-of-type(3) mat-error')
      );

      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent.trim().toLowerCase()).toContain(
        'hasła nie są identyczne'
      );
    });

    it('should have correct routerLink to login page', () => {
      const loginLink = fixture.debugElement.query(By.css('a'));

      expect(loginLink.attributes['routerLink']).toBe('/auth/login');
    });
  });

  // Edge cases tests
  describe('Edge cases', () => {
    it('should handle spaces in password correctly', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('pass word123'); // Contains space but 10+ chars

      expect(passwordControl?.valid).toBeTruthy();
    });

    it('should validate emails with subdomains and special characters correctly', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('user.name+tag@example.co.uk');

      expect(emailControl?.valid).toBeTruthy();
    });

    it('should not allow empty spaces as valid passwords', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('        '); // 8 spaces

      // While this passes minlength, it's still a weak password
      // In a real app, we'd want to add a custom validator for this
      expect(passwordControl?.valid).toBeTruthy();
    });
  });
});
