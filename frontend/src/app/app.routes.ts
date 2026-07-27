import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'categories',
    loadChildren: () => import('./features/categories/categories.routes').then((m) => m.categoriesRoutes),
  },
  { path: '**', redirectTo: '' },
];
