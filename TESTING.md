# Testing Guide

This project uses Jest for unit testing and Playwright for E2E testing.

## Unit Testing with Jest

Unit tests are used to test individual components, services, pipes, and other smaller units of code in isolation.

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Writing Unit Tests

- Place test files next to the files they test with the naming convention `*.spec.ts`
- Use Angular Testing Library for testing components
- Use Jest's mocking capabilities for testing services
- Aim for at least 80% code coverage

#### Component Testing Example

```typescript
import { render, screen, fireEvent } from '@testing-library/angular';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  it('should display the correct title', async () => {
    await render(MyComponent);
    expect(screen.getByRole('heading')).toHaveTextContent('Expected Title');
  });

  it('should handle button click', async () => {
    await render(MyComponent);
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    expect(screen.getByText('Button was clicked')).toBeInTheDocument();
  });
});
```

#### Service Testing Example

```typescript
import { TestBed } from '@angular/core/testing';
import { MyService } from './my.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

describe('MyService', () => {
  let service: MyService;
  let httpClientSpy: jest.Mocked<HttpClient>;

  beforeEach(() => {
    const spy = jest.fn();

    TestBed.configureTestingModule({
      providers: [MyService, { provide: HttpClient, useValue: { get: spy } }],
    });

    service = TestBed.inject(MyService);
    httpClientSpy = TestBed.inject(HttpClient) as jest.Mocked<HttpClient>;
  });

  it('should return expected data', done => {
    const expectedData = { name: 'Test Data' };
    httpClientSpy.get.mockReturnValue(of(expectedData));

    service.getData().subscribe({
      next: data => {
        expect(data).toEqual(expectedData);
        done();
      },
      error: done.fail,
    });

    expect(httpClientSpy.get).toHaveBeenCalledWith('api/data');
  });
});
```

## E2E Testing with Playwright

End-to-end tests verify that all parts of the application work together as expected from a user's perspective.

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# View the HTML report
npm run test:e2e:report
```

### Writing E2E Tests

- Place E2E tests in the `e2e` directory
- Use the Page Object Model pattern for maintainable tests
- Focus on critical user journeys

#### Page Object Model Example

```typescript
// e2e/pages/login.page.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

// e2e/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';

test.describe('Login page', () => {
  test('successful login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password');
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not depend on other tests.
2. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification phases.
3. **Mock External Dependencies**: Use mocks for external services, APIs, and other dependencies.
4. **Test Data**: Use factory functions or fixtures to create test data.
5. **Meaningful Assertions**: Write assertions that clearly convey what you're testing.
6. **Clean Up**: Tests should clean up after themselves, leaving no side effects.
7. **Continuous Integration**: Run tests on each commit and before deployment.
