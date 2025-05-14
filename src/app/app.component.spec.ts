import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { SupabaseService } from './core/supabase/supabase.service';

// Create a mock for SupabaseService
const supabaseServiceMock = {
  authChanges: jest.fn().mockImplementation(callback => {
    // Call the callback with null event and null session
    callback(null, null);
    // Return an unsubscribe function that does nothing
    return { data: { subscription: { unsubscribe: () => {} } } };
  }),
};

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppComponent],
      providers: [
        {
          provide: 'APP_ENVIRONMENT',
          useValue: {
            production: false,
            supabaseUrl: 'https://mock.supabase.co',
            supabaseKey: 'mock-key',
          },
        },
        { provide: SupabaseService, useValue: supabaseServiceMock },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'meal2list' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toBe('meal2list');
  });
});
