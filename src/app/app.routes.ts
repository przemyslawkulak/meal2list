import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AccountComponent } from './auth/account/account.component';
import { authGuard, publicGuard } from './core/guards/auth.guard';
import { ShoppingListGenerationComponent } from './features/generate/generation.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard],
  },
  {
    path: 'account',
    component: AccountComponent,
    canActivate: [authGuard],
  },
  {
    path: 'generate',
    component: ShoppingListGenerationComponent,
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: '/account',
    pathMatch: 'full',
  },
];
