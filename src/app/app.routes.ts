import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AccountComponent } from './auth/account/account.component';
import { authGuard, publicGuard } from './core/guards/auth.guard';
import { ShoppingListGenerationComponent } from './features/generate/generation.component';
import { CategoriesComponent } from './features/categories/categories.component';
import { CreateShoppingListComponent } from './features/shopping-lists/create/create-shopping-list.component';
import { ShoppingListDetailComponent } from './features/shopping-list/detail/shopping-list-detail.component';

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
    path: 'categories', // TODO: to delete after testing categories
    component: CategoriesComponent,
  },
  {
    path: 'create-shopping-list', // TODO: to delete after testing
    component: CreateShoppingListComponent,
    title: 'Create Shopping List',
  },
  {
    path: 'shopping-lists/:id', // TODO: to delete after testing
    component: ShoppingListDetailComponent,
    title: 'Shopping List Details',
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
];
