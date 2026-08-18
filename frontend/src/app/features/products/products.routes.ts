import { Routes } from '@angular/router';

// loadComponent() dynamically imports the page component, so it (and its transitive
// dependencies) only end up in a separate JS chunk fetched when the user visits /products,
// instead of being bundled into the initial app load.
export const productsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/products-page/products-page.component').then((m) => m.ProductsPageComponent),
  },
];
