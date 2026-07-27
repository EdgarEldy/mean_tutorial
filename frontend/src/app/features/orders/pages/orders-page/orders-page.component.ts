import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { OrderFormComponent, OrderFormDialogData } from '../../components/order-form/order-form.component';
import { OrderListComponent } from '../../components/order-list/order-list.component';
import { Order, OrderInput } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

// Route-level page for the orders resource.
// Owns the order list state and coordinates the create/edit form dialog and the delete
// confirmation dialog, reloading the list after every successful mutation. Also serves the
// /orders/:id/edit deep link: if order.resolver.ts preloaded an order into route data, the
// edit dialog opens immediately with it instead of waiting for the user to click a row.
@Component({
  selector: 'app-orders-page',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, OrderListComponent],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.css',
})
export class OrdersPageComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(false);

  // The '' and ':id/edit' routes both loadComponent() this same page, so Angular's default
  // route reuse strategy keeps reusing this instance across navigations between them and
  // never re-runs ngOnInit. Reading route.data as a signal (instead of a one-time
  // snapshot in ngOnInit) reacts correctly even when the component itself isn't recreated,
  // e.g. navigating straight from /orders/5/edit to /orders/7/edit.
  private readonly routeData = toSignal(this.route.data, { initialValue: this.route.snapshot.data });

  constructor() {
    effect(() => {
      const resolvedOrder = this.routeData()['order'] as Order | null | undefined;
      if (!resolvedOrder) return;
      // Navigate back to the plain list once the deep-linked dialog closes (saved or
      // cancelled), so the URL doesn't keep pointing at :id/edit with nothing open.
      this.openEditDialog(resolvedOrder)
        .afterClosed()
        .subscribe(() => this.router.navigate(['/orders']));
    });
  }

  ngOnInit(): void {
    this.load();
  }

  openCreateDialog(): void {
    this.openFormDialog();
  }

  openEditDialog(order: Order): MatDialogRef<OrderFormComponent, OrderInput> {
    return this.openFormDialog(order);
  }

  confirmDelete(order: Order): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Delete order',
        message: `Delete order #${order.id}? This cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.orderService.delete(order.id).subscribe({ next: () => this.load(), error: () => {} });
    });
  }

  private openFormDialog(order?: Order): MatDialogRef<OrderFormComponent, OrderInput> {
    const dialogRef = this.dialog.open<OrderFormComponent, OrderFormDialogData, OrderInput>(OrderFormComponent, {
      width: '480px',
      data: { order },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const request = order ? this.orderService.update(order.id, result) : this.orderService.create(result);
      request.subscribe({ next: () => this.load(), error: () => {} });
    });

    return dialogRef;
  }

  private load(): void {
    this.loading.set(true);
    this.orderService.getAll().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
