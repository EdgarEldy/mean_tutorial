import { Component, computed, input, output } from '@angular/core';
import { DataTableAction, DataTableColumn } from '../../../../shared/components/data-table/data-table.model';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { Customer } from '../../models/customer.model';

// Presentational wrapper that configures the shared data table for the customer resource
// and turns its row actions into edit/delete outputs for the parent page to handle.
@Component({
  selector: 'app-customer-list',
  imports: [DataTableComponent],
  templateUrl: './customer-list.component.html',
})
export class CustomerListComponent {
  readonly customers = input.required<Customer[]>();
  // UI-only role gating: hides the edit/delete actions for non-admins. The backend does not
  // yet enforce this on the /customers routes (see README's feature/frontend/auth section), so
  // this is a courtesy, not a security boundary.
  readonly isAdmin = input(false);
  readonly edit = output<Customer>();
  readonly delete = output<Customer>();

  // Every field can be null, so each column falls back to a placeholder instead of
  // rendering "null" when a customer was created without that detail filled in.
  protected readonly columns: DataTableColumn<Customer>[] = [
    { key: 'name', header: 'Name', value: (row) => this.fullName(row) },
    { key: 'email', header: 'Email', value: (row) => row.email ?? 'N/A' },
    { key: 'telephone', header: 'Telephone', value: (row) => row.telephone ?? 'N/A' },
  ];

  protected readonly actions = computed<DataTableAction<Customer>[]>(() =>
    this.isAdmin()
      ? [
          { icon: 'edit', label: 'Edit', handler: (row) => this.edit.emit(row) },
          { icon: 'delete', label: 'Delete', handler: (row) => this.delete.emit(row) },
        ]
      : [],
  );

  private fullName(customer: Customer): string {
    const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ');
    return name || 'N/A';
  }
}
