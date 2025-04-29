import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AccountComponent } from './auth/account/account.component';
import { CategoriesComponent } from './features/categories/categories.component';
import { ShoppingListDetailComponent } from './features/shopping-list/detail/shopping-list-detail.component';
import { ShellComponent } from './layout/shell/shell.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    // canActivate: [publicGuard],
  },
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'account',
        component: AccountComponent,
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
          import('./features/lists/generate/generate-list.page').then(
            m => m.GenerateListPageComponent
          ),
        title: 'Generate Shopping List',
      },
      {
        path: 'lists',
        loadComponent: () =>
          import(
            './features/shopping-lists/pages/shopping-lists-page/shopping-lists-page.component'
          ).then(m => m.ShoppingListsPageComponent),
      },
      {
        path: 'kitchen-sink',
        loadComponent: () =>
          import('../pages/kitchen-sink/kitchen-sink.page').then(m => m.KitchenSinkPageComponent),
        title: 'Kitchen Sink',
      },
      {
        path: '',
        redirectTo: 'lists',
        pathMatch: 'full',
      },
    ],
  },
  {
    // Route for the component showcase page
    path: 'kitchen-sink',
    loadComponent: () =>
      import('../pages/kitchen-sink/kitchen-sink.page').then(m => m.KitchenSinkPageComponent),
    title: 'Kitchen Sink',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
