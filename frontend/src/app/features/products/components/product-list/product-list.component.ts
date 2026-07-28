import { Component, computed, input, output } from '@angular/core';
import { DataTableAction, DataTableColumn } from '../../../../shared/components/data-table/data-table.model';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { Product } from '../../models/product.model';

// Presentational wrapper that configures the shared data table for the product resource
// and turns its row actions into edit/delete outputs for the parent page to handle.
@Component({
  selector: 'app-product-list',
  imports: [DataTableComponent],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent {
  readonly products = input.required<Product[]>();
  // UI-only role gating: hides the edit/delete actions for non-admins. The backend does not
  // yet enforce this on the /products routes (see README's feature/frontend/auth section), so
  // this is a courtesy, not a security boundary.
  readonly isAdmin = input(false);
  readonly edit = output<Product>();
  readonly delete = output<Product>();

  // computed() re-derives this only when the products input signal actually changes, instead
  // of recalculating on every change-detection pass like a template expression would.
  protected readonly productCount = computed(() => this.products().length);

  // The backend already resolves each product's category (see product.repository.js's
  // `include`), so the category name is read straight off the row instead of triggering
  // another request per product.
  protected readonly columns: DataTableColumn<Product>[] = [
    { key: 'product_name', header: 'Name', value: (row) => row.product_name },
    { key: 'category_name', header: 'Category', value: (row) => row.category?.category_name ?? 'Uncategorized' },
    { key: 'unit_price', header: 'Unit price', value: (row) => `$${row.unit_price.toFixed(2)}` },
  ];

  protected readonly actions = computed<DataTableAction<Product>[]>(() =>
    this.isAdmin()
      ? [
          { icon: 'edit', label: 'Edit', handler: (row) => this.edit.emit(row) },
          { icon: 'delete', label: 'Delete', handler: (row) => this.delete.emit(row) },
        ]
      : [],
  );
}
