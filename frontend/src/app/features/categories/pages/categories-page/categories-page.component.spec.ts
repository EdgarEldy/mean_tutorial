import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CategoryFormComponent } from '../../components/category-form/category-form.component';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';
import { CategoriesPageComponent } from './categories-page.component';

const categories: Category[] = [
  { id: 1, category_name: 'Books' },
  { id: 2, category_name: 'Electronics' },
];

describe('CategoriesPageComponent', () => {
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let afterClosedSubject: Subject<unknown>;
  let dialogRefStub: { afterClosed: () => Observable<unknown> };
  let authStateStub: { isAdmin: ReturnType<typeof signal<boolean>> };

  beforeEach(() => {
    categoryServiceSpy = jasmine.createSpyObj<CategoryService>('CategoryService', [
      'getAll',
      'create',
      'update',
      'delete',
    ]);
    categoryServiceSpy.getAll.and.returnValue(of(categories));

    afterClosedSubject = new Subject<unknown>();
    dialogRefStub = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(dialogRefStub as MatDialogRef<unknown>);

    // isAdmin defaults to true so the pre-existing "New category" button tests keep finding it.
    authStateStub = { isAdmin: signal(true) };

    TestBed.configureTestingModule({
      imports: [CategoriesPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: AuthStateService, useValue: authStateStub },
      ],
    });
  });

  function createComponent() {
    return TestBed.createComponent(CategoriesPageComponent);
  }

  describe('ngOnInit / load', () => {
    it('should load categories and toggle loading on success', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      expect(categoryServiceSpy.getAll).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance['categories']()).toEqual(categories);
      expect(fixture.componentInstance['loading']()).toBeFalse();
    });

    it('should set loading to false when the load request fails', () => {
      categoryServiceSpy.getAll.and.returnValue(throwError(() => new Error('boom')));

      const fixture = createComponent();
      fixture.detectChanges();

      expect(fixture.componentInstance['categories']()).toEqual([]);
      expect(fixture.componentInstance['loading']()).toBeFalse();
    });
  });

  describe('openCreateDialog', () => {
    it('should open the form dialog with no category and reload after a successful create', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      categoryServiceSpy.getAll.calls.reset();

      const created: Category = { id: 3, category_name: 'New' };
      categoryServiceSpy.create.and.returnValue(of(created));

      fixture.componentInstance.openCreateDialog();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        CategoryFormComponent,
        jasmine.objectContaining({ data: { category: undefined } }),
      );

      afterClosedSubject.next({ category_name: 'New' });

      expect(categoryServiceSpy.create).toHaveBeenCalledWith({ category_name: 'New' });
      expect(categoryServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });

    it('should not call create nor reload when the dialog is cancelled', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      categoryServiceSpy.getAll.calls.reset();

      fixture.componentInstance.openCreateDialog();
      afterClosedSubject.next(undefined);

      expect(categoryServiceSpy.create).not.toHaveBeenCalled();
      expect(categoryServiceSpy.getAll).not.toHaveBeenCalled();
    });

    it('should not reload when the create request errors', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      categoryServiceSpy.getAll.calls.reset();

      categoryServiceSpy.create.and.returnValue(throwError(() => new Error('boom')));

      fixture.componentInstance.openCreateDialog();
      afterClosedSubject.next({ category_name: 'New' });

      expect(categoryServiceSpy.create).toHaveBeenCalled();
      expect(categoryServiceSpy.getAll).not.toHaveBeenCalled();
    });
  });

  describe('openEditDialog', () => {
    it('should open the form dialog pre-filled with the category and reload after a successful update', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      categoryServiceSpy.getAll.calls.reset();

      const target = categories[0];
      const updated: Category = { ...target, category_name: 'Updated' };
      categoryServiceSpy.update.and.returnValue(of(updated));

      fixture.componentInstance.openEditDialog(target);

      expect(dialogSpy.open).toHaveBeenCalledWith(
        CategoryFormComponent,
        jasmine.objectContaining({ data: { category: target } }),
      );

      afterClosedSubject.next({ category_name: 'Updated' });

      expect(categoryServiceSpy.update).toHaveBeenCalledWith(target.id, { category_name: 'Updated' });
      expect(categoryServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });

    it('should not call update nor reload when the dialog is cancelled', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      categoryServiceSpy.getAll.calls.reset();

      fixture.componentInstance.openEditDialog(categories[0]);
      afterClosedSubject.next(undefined);

      expect(categoryServiceSpy.update).not.toHaveBeenCalled();
      expect(categoryServiceSpy.getAll).not.toHaveBeenCalled();
    });
  });

  describe('confirmDelete', () => {
    it('should open the confirm dialog and reload after a confirmed delete', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      categoryServiceSpy.getAll.calls.reset();

      const target = categories[0];
      categoryServiceSpy.delete.and.returnValue(of(undefined));

      fixture.componentInstance.confirmDelete(target);

      expect(dialogSpy.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        jasmine.objectContaining({
          data: {
            title: 'Delete category',
            message: `Delete "${target.category_name}"? This cannot be undone.`,
          },
        }),
      );

      afterClosedSubject.next(true);

      expect(categoryServiceSpy.delete).toHaveBeenCalledWith(target.id);
      expect(categoryServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });

    it('should not call delete nor reload when the confirmation is declined', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      categoryServiceSpy.getAll.calls.reset();

      fixture.componentInstance.confirmDelete(categories[0]);
      afterClosedSubject.next(false);

      expect(categoryServiceSpy.delete).not.toHaveBeenCalled();
      expect(categoryServiceSpy.getAll).not.toHaveBeenCalled();
    });

    it('should not reload when the delete request errors', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      categoryServiceSpy.getAll.calls.reset();

      categoryServiceSpy.delete.and.returnValue(throwError(() => new Error('boom')));

      fixture.componentInstance.confirmDelete(categories[0]);
      afterClosedSubject.next(true);

      expect(categoryServiceSpy.delete).toHaveBeenCalled();
      expect(categoryServiceSpy.getAll).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin gating', () => {
    it('should show the "New category" button when the user is admin', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll('button')).map((b) => b.textContent?.trim());
      expect(buttons.some((text) => text?.includes('New category'))).toBeTrue();
    });

    it('should hide the "New category" button when the user is not admin', () => {
      authStateStub.isAdmin.set(false);

      const fixture = createComponent();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll('button')).map((b) => b.textContent?.trim());
      expect(buttons.some((text) => text?.includes('New category'))).toBeFalse();
    });
  });
});
