import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Product } from '../../models/product.model';
import { ProductListComponent } from './product-list.component';

const products: Product[] = [
  { id: 1, category_id: 1, product_name: 'Widget', unit_price: 9.99, category: { id: 1, category_name: 'Books' } },
  { id: 2, category_id: 2, product_name: 'Gadget', unit_price: 19.5 },
];

describe('ProductListComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [provideNoopAnimations()],
    }),
  );

  function createComponent(data: Product[] = products) {
    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.componentRef.setInput('products', data);
    return fixture;
  }

  it('should create the component', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should wire product_name, category and unit_price columns', () => {
    const fixture = createComponent();
    const columns = fixture.componentInstance['columns'];

    expect(columns.length).toBe(3);
    expect(columns[0].key).toBe('product_name');
    expect(columns[0].header).toBe('Name');
    expect(columns[0].value(products[0])).toBe('Widget');

    expect(columns[1].key).toBe('category_name');
    expect(columns[1].header).toBe('Category');

    expect(columns[2].key).toBe('unit_price');
    expect(columns[2].header).toBe('Unit price');
  });

  it('should format unit_price as $X.XX', () => {
    const fixture = createComponent();
    const columns = fixture.componentInstance['columns'];

    expect(columns[2].value(products[0])).toBe('$9.99');
    expect(columns[2].value(products[1])).toBe('$19.50');
  });

  it('should read the category name off row.category when present', () => {
    const fixture = createComponent();
    const columns = fixture.componentInstance['columns'];

    expect(columns[1].value(products[0])).toBe('Books');
  });

  it('should fall back to "Uncategorized" when row.category is missing (e.g. the create response)', () => {
    const fixture = createComponent();
    const columns = fixture.componentInstance['columns'];

    expect(columns[1].value(products[1])).toBe('Uncategorized');
  });

  it('should wire edit and delete row actions', () => {
    const fixture = createComponent();
    const actions = fixture.componentInstance['actions'];

    expect(actions.length).toBe(2);
    expect(actions[0].icon).toBe('edit');
    expect(actions[1].icon).toBe('delete');
  });

  it('should emit edit with the correct row when the edit action handler runs', () => {
    const fixture = createComponent();
    const emitSpy = jasmine.createSpy('edit');
    fixture.componentInstance.edit.subscribe(emitSpy);

    fixture.componentInstance['actions'][0].handler(products[1]);

    expect(emitSpy).toHaveBeenCalledWith(products[1]);
  });

  it('should emit delete with the correct row when the delete action handler runs', () => {
    const fixture = createComponent();
    const emitSpy = jasmine.createSpy('delete');
    fixture.componentInstance.delete.subscribe(emitSpy);

    fixture.componentInstance['actions'][1].handler(products[0]);

    expect(emitSpy).toHaveBeenCalledWith(products[0]);
  });

  it('should compute productCount from the products input', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance['productCount']()).toBe(2);
  });

  it('should recompute productCount when the products input changes', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance['productCount']()).toBe(2);

    fixture.componentRef.setInput('products', [products[0]]);
    expect(fixture.componentInstance['productCount']()).toBe(1);
  });

  it('should render the product count in the template', () => {
    const fixture = createComponent();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.product-count')?.textContent?.trim()).toBe('2 product(s)');
  });

  it('should render one row per product via the shared data table', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dataRows = compiled.querySelectorAll('table.data-table tr.mat-mdc-row');
    expect(dataRows.length).toBe(products.length);
  });

  it('should emit edit when the row edit button is clicked in the DOM', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.detectChanges();

    const emitSpy = jasmine.createSpy('edit');
    fixture.componentInstance.edit.subscribe(emitSpy);

    const compiled = fixture.nativeElement as HTMLElement;
    const editButtons = compiled.querySelectorAll('button[aria-label="Edit"]');
    expect(editButtons.length).toBe(products.length);

    (editButtons[1] as HTMLButtonElement).click();

    expect(emitSpy).toHaveBeenCalledWith(products[1]);
  });

  it('should emit delete when the row delete button is clicked in the DOM', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.detectChanges();

    const emitSpy = jasmine.createSpy('delete');
    fixture.componentInstance.delete.subscribe(emitSpy);

    const compiled = fixture.nativeElement as HTMLElement;
    const deleteButtons = compiled.querySelectorAll('button[aria-label="Delete"]');
    expect(deleteButtons.length).toBe(products.length);

    (deleteButtons[0] as HTMLButtonElement).click();

    expect(emitSpy).toHaveBeenCalledWith(products[0]);
  });
});
