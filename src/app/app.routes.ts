import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { ShoppingListDetailComponent } from './features/shopping-lists/pages/detail/shopping-list-detail.component';

export const routes: Routes = [
  // Shell routes (both public and protected)
  {
    path: '',
    component: ShellComponent,
    children: [
      // Public Landing Page
      {
        path: '',
        loadComponent: () => import('./features/landing').then(m => m.LandingPageComponent),
        title: 'Meal2List - Inteligentne Listy Zakupów',
      },
      // Protected App Routes
      {
        path: 'app',
        canActivate: [authGuard],
        children: [
          {
            path: 'categories',
            loadComponent: () =>
              import('./features/categories/categories.component').then(m => m.CategoriesComponent),
          },
          {
            path: 'lists/:id',
            component: ShoppingListDetailComponent,
            title: 'Shopping List Details',
          },
          {
            path: 'generate',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/lists/generate/generate-list.page').then(
                    m => m.GenerateListPageComponent
                  ),
                title: 'Generate Shopping List',
              },
              {
                path: 'review',
                loadComponent: () =>
                  import('./features/generation-review/generation-review.page').then(
                    m => m.GenerationReviewPageComponent
                  ),
                title: 'Review Generated Items',
              },
            ],
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
              import('../pages/kitchen-sink/kitchen-sink.page').then(
                m => m.KitchenSinkPageComponent
              ),
            title: 'Kitchen Sink',
          },
          {
            path: '',
            redirectTo: 'lists',
            pathMatch: 'full',
          },
        ],
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
