import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { ShoppingListDetailComponent } from './features/shopping-lists/pages/detail/shopping-list-detail.component';

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
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.component').then(m => m.CategoriesComponent),
      },
      {
        path: 'lists/:id', // TODO: to delete after testing
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
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
