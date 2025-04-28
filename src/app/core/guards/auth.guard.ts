import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../supabase/supabase.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const supabase = inject(SupabaseService);

  if (!supabase.session) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};

export const publicGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (!supabase.session) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
