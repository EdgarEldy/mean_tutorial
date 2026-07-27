import { Routes } from '@angular/router';

// loadComponent() dynamically imports the page component, so it (and its transitive
// dependencies) only end up in a separate JS chunk fetched when the user visits /categories,
// instead of being bundled into the initial app load.
export const categoriesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/categories-page/categories-page.component').then((m) => m.CategoriesPageComponent),
  },
];
