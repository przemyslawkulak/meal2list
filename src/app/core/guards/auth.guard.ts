import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../supabase/auth.service';
import { map, take, tap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated$.pipe(
    take(1),
    tap(isAuthenticated => {
      if (!isAuthenticated) {
        // Save intended URL for redirect after login
        const returnUrl = state.url;
        console.log('AuthGuard: Redirecting to login with returnUrl:', returnUrl);
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl },
          replaceUrl: true,
        });
      }
    }),
    map(isAuthenticated => isAuthenticated)
  );
};
