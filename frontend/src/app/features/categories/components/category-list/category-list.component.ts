import { Component, input, output } from '@angular/core';
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
  readonly edit = output<Category>();
  readonly delete = output<Category>();

  protected readonly columns: DataTableColumn<Category>[] = [
    { key: 'category_name', header: 'Name', value: (row) => row.category_name },
  ];

  protected readonly actions: DataTableAction<Category>[] = [
    { icon: 'edit', label: 'Edit', handler: (row) => this.edit.emit(row) },
    { icon: 'delete', label: 'Delete', handler: (row) => this.delete.emit(row) },
  ];
}
