import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Category } from '../../models/category.model';
import { CategoryListComponent } from './category-list.component';

const categories: Category[] = [
  { id: 1, category_name: 'Books' },
  { id: 2, category_name: 'Electronics' },
];

describe('CategoryListComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [CategoryListComponent],
      providers: [provideNoopAnimations()],
    }),
  );

  function createComponent(isAdmin = true) {
    const fixture = TestBed.createComponent(CategoryListComponent);
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('isAdmin', isAdmin);
    return fixture;
  }

  it('should create the component', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should wire a single "Name" column driven off category_name', () => {
    const fixture = createComponent();
    const columns = fixture.componentInstance['columns'];

    expect(columns.length).toBe(1);
    expect(columns[0].key).toBe('category_name');
    expect(columns[0].header).toBe('Name');
    expect(columns[0].value(categories[0])).toBe('Books');
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

  it('should render one row per category via the shared data table', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dataRows = compiled.querySelectorAll('table.data-table tr.mat-mdc-row');
    expect(dataRows.length).toBe(categories.length);
  });

  it('should emit edit with the correct row when the edit action handler runs', () => {
    const fixture = createComponent();
    const emitSpy = jasmine.createSpy('edit');
    fixture.componentInstance.edit.subscribe(emitSpy);

    fixture.componentInstance['actions']()[0].handler(categories[1]);

    expect(emitSpy).toHaveBeenCalledWith(categories[1]);
  });

  it('should emit delete with the correct row when the delete action handler runs', () => {
    const fixture = createComponent();
    const emitSpy = jasmine.createSpy('delete');
    fixture.componentInstance.delete.subscribe(emitSpy);

    fixture.componentInstance['actions']()[1].handler(categories[0]);

    expect(emitSpy).toHaveBeenCalledWith(categories[0]);
  });

  it('should emit edit when the row edit button is clicked in the DOM', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.detectChanges();

    const emitSpy = jasmine.createSpy('edit');
    fixture.componentInstance.edit.subscribe(emitSpy);

    const compiled = fixture.nativeElement as HTMLElement;
    const editButtons = compiled.querySelectorAll('button[aria-label="Edit"]');
    expect(editButtons.length).toBe(categories.length);

    (editButtons[1] as HTMLButtonElement).click();

    expect(emitSpy).toHaveBeenCalledWith(categories[1]);
  });

  it('should emit delete when the row delete button is clicked in the DOM', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    fixture.detectChanges();

    const emitSpy = jasmine.createSpy('delete');
    fixture.componentInstance.delete.subscribe(emitSpy);

    const compiled = fixture.nativeElement as HTMLElement;
    const deleteButtons = compiled.querySelectorAll('button[aria-label="Delete"]');
    expect(deleteButtons.length).toBe(categories.length);

    (deleteButtons[0] as HTMLButtonElement).click();

    expect(emitSpy).toHaveBeenCalledWith(categories[0]);
  });
});
