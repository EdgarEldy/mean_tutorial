import { Routes } from '@angular/router';
import { orderResolver } from './order.resolver';

// loadComponent() dynamically imports the page component, so it (and its transitive
// dependencies) only end up in a separate JS chunk fetched when the user visits /orders,
// instead of being bundled into the initial app load. Both routes point at the same page
// component: the :id/edit variant additionally resolves an order and opens straight into the
// edit dialog (see orders-page.component.ts's ngOnInit).
export const ordersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/orders-page/orders-page.component').then((m) => m.OrdersPageComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/orders-page/orders-page.component').then((m) => m.OrdersPageComponent),
    resolve: { order: orderResolver },
  },
];
