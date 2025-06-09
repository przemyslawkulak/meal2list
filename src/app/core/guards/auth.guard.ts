import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../supabase/auth.service';
import { of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.validateSession().pipe(
    take(1),
    switchMap(isValid => {
      if (isValid) {
        return of(true);
      }
      router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url }, replaceUrl: true });
      return of(false);
    })
  );
};
