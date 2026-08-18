import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Customer } from '../../models/customer.model';
import { CustomerListComponent } from './customer-list.component';

const customers: Customer[] = [
  { id: 1, first_name: 'Ada', last_name: 'Lovelace', telephone: '555-1234', email: 'ada@example.com', address: '123 Main St' },
  { id: 2, first_name: 'Alan', last_name: null, telephone: null, email: null, address: null },
  { id: 3, first_name: null, last_name: null, telephone: null, email: null, address: null },
];

describe('CustomerListComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [provideNoopAnimations()],
    }),
  );

  function createComponent(isAdmin = true) {
    const fixture = TestBed.createComponent(CustomerListComponent);
    fixture.componentRef.setInput('customers', customers);
    fixture.componentRef.setInput('isAdmin', isAdmin);
    return fixture;
  }

  it('should create the component', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should wire name, email and telephone columns', () => {
    const fixture = createComponent();
    const columns = fixture.componentInstance['columns'];

    expect(columns.length).toBe(3);
    expect(columns[0].key).toBe('name');
    expect(columns[0].header).toBe('Name');
    expect(columns[1].key).toBe('email');
    expect(columns[1].header).toBe('Email');
    expect(columns[2].key).toBe('telephone');
    expect(columns[2].header).toBe('Telephone');
  });

  describe('name column (fullName)', () => {
    it('should join first_name and last_name for a fully-populated customer', () => {
      const fixture = createComponent();
      const columns = fixture.componentInstance['columns'];

      expect(columns[0].value(customers[0])).toBe('Ada Lovelace');
    });

    it('should show just the first name when last_name is null, without stray whitespace or "null"', () => {
      const fixture = createComponent();
      const columns = fixture.componentInstance['columns'];

      expect(columns[0].value(customers[1])).toBe('Alan');
    });

    it('should fall back to "N/A" when both first_name and last_name are null', () => {
      const fixture = createComponent();
      const columns = fixture.componentInstance['columns'];

      expect(columns[0].value(customers[2])).toBe('N/A');
    });
  });

  describe('email column', () => {
    it('should render the email when present', () => {
      const fixture = createComponent();
      const columns = fixture.componentInstance['columns'];

      expect(columns[1].value(customers[0])).toBe('ada@example.com');
    });

    it('should fall back to "N/A" when email is null', () => {
      const fixture = createComponent();
      const columns = fixture.componentInstance['columns'];

      expect(columns[1].value(customers[1])).toBe('N/A');
      expect(columns[1].value(customers[2])).toBe('N/A');
    });
  });

  describe('telephone column', () => {
    it('should render the telephone when present', () => {
      const fixture = createComponent();
      const columns = fixture.componentInstance['columns'];

      expect(columns[2].value(customers[0])).toBe('555-1234');
    });

    it('should fall back to "N/A" when telephone is null', () => {
      const fixture = createComponent();
      const columns = fixture.componentInstance['columns'];

      expect(columns[2].value(customers[1])).toBe('N/A');
      expect(columns[2].value(customers[2])).toBe('N/A');
    });
  });

  it('should wire edit and delete row actions when isAdmin is true', () => {
    const fixture = createComponent();
    const actions = fixture.componentInstance['actions']();

    expect(actions.length).toBe(2);
    expect(actions[0].icon).toBe('edit');
    expect(actions[1].icon).toBe('delete');
  });

  it('should expose no actions when isAdmin is false (the default)', () => {
    const fixture = createComponent(false);

    expect(fixture.componentInstance['actions']()).toEqual([]);
  });

  it('should hide the actions column entirely and render no edit/delete buttons when isAdmin is false', () => {
    const fixture = createComponent(false);
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('button[aria-label="Edit"]').length).toBe(0);
    expect(compiled.querySelectorAll('button[aria-label="Delete"]').length).toBe(0);
  });

  it('should render one row per customer via the shared data table', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dataRows = compiled.querySelectorAll('table.data-table tr.mat-mdc-row');
    expect(dataRows.length).toBe(customers.length);
  });

  it('should emit edit with the correct row when the edit action handler runs', () => {
    const fixture = createComponent();
    const emitSpy = jasmine.createSpy('edit');
    fixture.componentInstance.edit.subscribe(emitSpy);

    fixture.componentInstance['actions']()[0].handler(customers[1]);

    expect(emitSpy).toHaveBeenCalledWith(customers[1]);
  });

  it('should emit delete with the correct row when the delete action handler runs', () => {
    const fixture = createComponent();
    const emitSpy = jasmine.createSpy('delete');
    fixture.componentInstance.delete.subscribe(emitSpy);

    fixture.componentInstance['actions']()[1].handler(customers[0]);

    expect(emitSpy).toHaveBeenCalledWith(customers[0]);
  });

  it('should emit edit when the row edit button is clicked in the DOM', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.detectChanges();

    const emitSpy = jasmine.createSpy('edit');
    fixture.componentInstance.edit.subscribe(emitSpy);

    const compiled = fixture.nativeElement as HTMLElement;
    const editButtons = compiled.querySelectorAll('button[aria-label="Edit"]');
    expect(editButtons.length).toBe(customers.length);

    (editButtons[1] as HTMLButtonElement).click();

    expect(emitSpy).toHaveBeenCalledWith(customers[1]);
  });

  it('should emit delete when the row delete button is clicked in the DOM', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.detectChanges();

    const emitSpy = jasmine.createSpy('delete');
    fixture.componentInstance.delete.subscribe(emitSpy);

    const compiled = fixture.nativeElement as HTMLElement;
    const deleteButtons = compiled.querySelectorAll('button[aria-label="Delete"]');
    expect(deleteButtons.length).toBe(customers.length);

    (deleteButtons[0] as HTMLButtonElement).click();

    expect(emitSpy).toHaveBeenCalledWith(customers[0]);
  });
});
