import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import { Order } from './models/order.model';
import { OrderService } from './services/order.service';

// Preloads the order behind /orders/:id/edit before the route activates, so a deep link (e.g.
// shared from elsewhere) lands the user straight in the edit dialog with data already in hand
// instead of the page needing to fetch it after the fact. Falls back to the orders list if the
// id doesn't resolve to a real order (OrderService.getById already toasts the error).
export const orderResolver: ResolveFn<Order> = (route) => {
  const orderService = inject(OrderService);
  const router = inject(Router);
  const id = route.paramMap.get('id')!;

  return orderService.getById(id).pipe(
    catchError(() => {
      router.navigateByUrl('/orders');
      return EMPTY;
    }),
  );
};
