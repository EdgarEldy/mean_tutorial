import { Routes } from '@angular/router';

// loadComponent() dynamically imports the page component, so it (and its transitive
// dependencies) only end up in a separate JS chunk fetched when the user visits /customers,
// instead of being bundled into the initial app load.
export const customersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/customers-page/customers-page.component').then((m) => m.CustomersPageComponent),
  },
];
