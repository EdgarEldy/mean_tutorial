import { Component, computed, input, output } from '@angular/core';
import { DataTableAction, DataTableColumn } from '../../../../shared/components/data-table/data-table.model';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-category-list',
  imports: [DataTableComponent],
  templateUrl: './category-list.component.html',
})
// Presentational wrapper that configures the shared data table for the category resource
// and turns its row actions into edit/delete outputs for the parent page to handle.
export class CategoryListComponent {
  // Signal-based input/output replace @Input()/@Output(): input.required() fails fast if the
  // parent forgets to bind it, and output() gives a plain emit() without an EventEmitter.
  readonly categories = input.required<Category[]>();
  // UI-only role gating: hides the edit/delete actions for non-admins. The backend does not
  // yet enforce this on the /categories routes (see README's feature/frontend/auth section),
  // so this is a courtesy, not a security boundary.
  readonly isAdmin = input(false);
  readonly edit = output<Category>();
  readonly delete = output<Category>();

  protected readonly columns: DataTableColumn<Category>[] = [
    { key: 'category_name', header: 'Name', value: (row) => row.category_name },
  ];

  protected readonly actions = computed<DataTableAction<Category>[]>(() =>
    this.isAdmin()
      ? [
          { icon: 'edit', label: 'Edit', handler: (row) => this.edit.emit(row) },
          { icon: 'delete', label: 'Delete', handler: (row) => this.delete.emit(row) },
        ]
      : [],
  );
}
