import { AfterViewInit, Component, computed, effect, input, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DataTableAction, DataTableColumn } from './data-table.model';

@Component({
  selector: 'app-data-table',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
})
export class DataTableComponent<T> implements AfterViewInit {
  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly actions = input<DataTableAction<T>[]>([]);
  readonly data = input.required<T[]>();
  readonly searchPlaceholder = input('Search');
  readonly exportFileName = input('export');

  private readonly paginator = viewChild(MatPaginator);

  readonly dataSource = new MatTableDataSource<T>([]);

  readonly displayedColumns = computed(() => [
    ...this.columns().map((column) => column.key),
    ...(this.actions().length ? ['actions'] : []),
  ]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.data();
    });

    this.dataSource.filterPredicate = (row, filter) =>
      this.columns().some((column) => column.value(row).toLowerCase().includes(filter));
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator() ?? null;
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  async exportPdf(): Promise<void> {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc = new jsPDF();
    autoTable(doc, {
      head: [this.columns().map((column) => column.header)],
      body: this.dataSource.filteredData.map((row) => this.columns().map((column) => column.value(row))),
    });
    doc.save(`${this.exportFileName()}.pdf`);
  }
}
