import {
  ApplicationConfig,
  importProvidersFrom,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { provideRouter } from '@angular/router';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { CategoriesStore, ProductsStore, AppInitializationService } from '@app/core/stores';

export interface AppEnvironment {
  production: boolean;
  supabaseUrl: string;
  supabaseKey: string;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideAnimations(),
    provideHttpClient(withFetch()),
    importProvidersFrom([MatNativeDateModule]),
    provideRouter(routes),
    {
      provide: 'APP_ENVIRONMENT',
      useValue: environment as AppEnvironment,
    },
    // NgRx SignalStore providers
    CategoriesStore,
    ProductsStore,
    AppInitializationService,

    // Modern app initialization approach (Angular 19+)
    // Uses RxJS observables directly - provideAppInitializer supports observables natively
    // Loads categories and products before the app becomes available to users
    provideAppInitializer(() => {
      const appInitService = inject(AppInitializationService);
      return appInitService.initializeApp();
    }),
  ],
};
