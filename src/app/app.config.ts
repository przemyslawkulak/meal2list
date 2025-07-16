import {
  ApplicationConfig,
  importProvidersFrom,
  provideAppInitializer,
  inject,
  ErrorHandler,
  LOCALE_ID,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { provideRouter } from '@angular/router';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { CategoriesStore, ProductsStore, AppInitializationService } from '@app/core/stores';
import { ErrorInterceptor, RetryInterceptor } from '@app/core/interceptors';
import { GlobalErrorHandler } from '@app/core/errors/global-error.handler';
import localePl from '@angular/common/locales/pl';

// Register Polish locale
registerLocaleData(localePl);

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
    {
      provide: LOCALE_ID,
      useValue: 'pl-PL',
    },
    // HTTP Interceptors for Authentication & Authorization Flow
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RetryInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
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
