import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AccountComponent } from './auth/account/account.component';
import { CategoriesComponent } from './features/categories/categories.component';
import { ShoppingListDetailComponent } from './features/shopping-list/detail/shopping-list-detail.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    // canActivate: [publicGuard],
  },
  {
    path: 'account',
    component: AccountComponent,
    // canActivate: [authGuard],
  },
  {
    path: 'categories', // TODO: to delete after testing categories
    component: CategoriesComponent,
  },
  {
    path: 'shopping-lists/:id', // TODO: to delete after testing
    component: ShoppingListDetailComponent,
    title: 'Shopping List Details',
  },
  {
    path: 'generate',
    loadComponent: () =>
      import('./features/lists/generate/generate-list.page').then(m => m.GenerateListPageComponent),
    // canActivate: [authGuard],
    title: 'Generate Shopping List',
  },
  {
    path: 'lists',
    loadComponent: () =>
      import(
        './features/shopping-lists/pages/shopping-lists-page/shopping-lists-page.component'
      ).then(m => m.ShoppingListsPageComponent),
    // canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: '/lists',
    pathMatch: 'full',
  },
];
