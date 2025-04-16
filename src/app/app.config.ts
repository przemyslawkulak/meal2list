import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../environments/environment';

export interface AppEnvironment {
  production: boolean;
  supabaseUrl: string;
  supabaseKey: string;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(),
    importProvidersFrom([MatNativeDateModule]),
    {
      provide: 'APP_ENVIRONMENT',
      useValue: environment as AppEnvironment,
    },
  ],
};
