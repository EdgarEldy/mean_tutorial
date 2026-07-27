import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import jsPDF from 'jspdf';
import { DataTableComponent } from './data-table.component';
import { DataTableAction, DataTableColumn } from './data-table.model';

interface TestRow {
  id: number;
  name: string;
}

const rows: TestRow[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
];

const columns: DataTableColumn<TestRow>[] = [
  { key: 'id', header: 'ID', value: (row) => String(row.id) },
  { key: 'name', header: 'Name', value: (row) => row.name },
];

describe('DataTableComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [DataTableComponent],
      providers: [provideNoopAnimations()],
    }),
  );

  function createComponent() {
    const fixture = TestBed.createComponent(DataTableComponent<TestRow>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    return fixture;
  }

  it('should create the data table', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render one row per data item with the correct cell text per column', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dataRows = compiled.querySelectorAll('table.data-table tr.mat-mdc-row');
    expect(dataRows.length).toBe(rows.length);

    dataRows.forEach((rowEl, index) => {
      const cells = rowEl.querySelectorAll('td');
      expect(cells[0].textContent?.trim()).toBe(String(rows[index].id));
      expect(cells[1].textContent?.trim()).toBe(rows[index].name);
    });
  });

  it('applyFilter should narrow filteredData to matching rows only, case-insensitively, on any column', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.detectChanges();

    fixture.componentInstance.applyFilter('bob');
    expect(fixture.componentInstance.dataSource.filteredData).toEqual([{ id: 2, name: 'Bob' }]);

    fixture.componentInstance.applyFilter('3');
    expect(fixture.componentInstance.dataSource.filteredData).toEqual([{ id: 3, name: 'Charlie' }]);

    fixture.componentInstance.applyFilter('nomatch');
    expect(fixture.componentInstance.dataSource.filteredData).toEqual([]);
  });

  it('should not render an actions column when actions is empty', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.detectChanges();

    expect(fixture.componentInstance.displayedColumns()).toEqual(['id', 'name']);

    const compiled = fixture.nativeElement as HTMLElement;
    const headerCells = compiled.querySelectorAll('th');
    expect(headerCells.length).toBe(columns.length);
  });

  it('should render an actions column and invoke the handler with the correct row when clicked', () => {
    const handler = jasmine.createSpy('handler');
    const actions: DataTableAction<TestRow>[] = [{ icon: 'delete', label: 'Delete', handler }];

    const fixture = createComponent();
    fixture.componentRef.setInput('actions', actions);
    fixture.detectChanges();
    fixture.detectChanges();

    expect(fixture.componentInstance.displayedColumns()).toEqual(['id', 'name', 'actions']);

    const compiled = fixture.nativeElement as HTMLElement;
    const actionButtons = compiled.querySelectorAll('button[aria-label="Delete"]');
    expect(actionButtons.length).toBe(rows.length);

    (actionButtons[1] as HTMLButtonElement).click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(rows[1]);
  });

  describe('exportPdf', () => {
    // jsPDF (v4) is a factory function that returns a fresh, plain object from
    // its constructor rather than an instance backed by jsPDF.prototype, so
    // `spyOn(jsPDF.prototype, 'save')` does not find a `save` method to spy on.
    // Instead, we use jsPDF's own documented plugin extension point
    // (`jsPDF.API`, see jspdf's "Extending jsPDF" docs) which every new
    // document instance mixes in - and is allowed to override built-ins - to
    // replace `save` with a spy before the document is created. This avoids
    // any real file I/O (blob creation / anchor click) during the test run.
    let saveSpy: jasmine.Spy;

    beforeEach(() => {
      saveSpy = jasmine.createSpy('save');
      (jsPDF.API as unknown as { save: jasmine.Spy }).save = saveSpy;
    });

    afterEach(() => {
      delete (jsPDF.API as unknown as { save?: jasmine.Spy }).save;
    });

    it('should build the pdf and save it under the configured file name without a real download', async () => {
      const fixture = createComponent();
      fixture.componentRef.setInput('exportFileName', 'my-export');
      fixture.detectChanges();
      fixture.detectChanges();

      await fixture.componentInstance.exportPdf();

      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledWith('my-export.pdf');
    });
  });
});
