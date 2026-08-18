import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'categories',
        loadChildren: () => import('./features/categories/categories.routes').then((m) => m.categoriesRoutes),
      },
    ],
  },
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.routes').then((m) => m.productsRoutes),
  },
  { path: '**', redirectTo: '' },
];
