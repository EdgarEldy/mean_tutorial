import { Component, computed, input, output } from '@angular/core';
import { DataTableAction, DataTableColumn } from '../../../../shared/components/data-table/data-table.model';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { Order } from '../../models/order.model';

// Presentational wrapper that configures the shared data table for the order resource
// and turns its row actions into edit/delete outputs for the parent page to handle.
@Component({
  selector: 'app-order-list',
  imports: [DataTableComponent],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent {
  readonly orders = input.required<Order[]>();
  // UI-only role gating: hides the edit/delete actions for non-admins. The backend does not
  // yet enforce this on the /orders resource (see README's feature/frontend/auth section), so
  // this is a courtesy, not a security boundary.
  readonly isAdmin = input(false);
  readonly edit = output<Order>();
  readonly delete = output<Order>();

  // Derived only from the orders input signal, recomputed only when the list actually changes.
  protected readonly totalRevenue = computed(() => this.orders().reduce((sum, order) => sum + order.total, 0));

  // customer/product are nullable in the GraphQL schema (a resolver could return null for a
  // dangling foreign key), so every column falls back instead of assuming they're always set.
  protected readonly columns: DataTableColumn<Order>[] = [
    { key: 'customer', header: 'Customer', value: (row) => this.customerName(row) },
    { key: 'product', header: 'Product', value: (row) => row.product?.product_name ?? 'Unknown product' },
    { key: 'quantity', header: 'Quantity', value: (row) => String(row.quantity) },
    { key: 'total', header: 'Total', value: (row) => `$${row.total.toFixed(2)}` },
  ];

  protected readonly actions = computed<DataTableAction<Order>[]>(() =>
    this.isAdmin()
      ? [
          { icon: 'edit', label: 'Edit', handler: (row) => this.edit.emit(row) },
          { icon: 'delete', label: 'Delete', handler: (row) => this.delete.emit(row) },
        ]
      : [],
  );

  private customerName(order: Order): string {
    if (!order.customer) return 'Unknown customer';
    const name = [order.customer.first_name, order.customer.last_name].filter(Boolean).join(' ');
    return name || `Customer #${order.customer.id}`;
  }
}
