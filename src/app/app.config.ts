import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { provideRouter } from '@angular/router';

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
    provideRouter(routes),
    {
      provide: 'APP_ENVIRONMENT',
      useValue: environment as AppEnvironment,
    },
  ],
};
