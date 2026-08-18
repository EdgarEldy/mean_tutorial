import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
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
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.routes').then((m) => m.productsRoutes),
      },
      {
        path: 'customers',
        loadChildren: () => import('./features/customers/customers.routes').then((m) => m.customersRoutes),
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ordersRoutes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
