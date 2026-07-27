import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
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
  { path: '**', redirectTo: '' },
];
