import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, Subject, of, throwError } from 'rxjs';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ProductFormComponent } from '../../components/product-form/product-form.component';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ProductsPageComponent } from './products-page.component';

const products: Product[] = [
  { id: 1, category_id: 1, product_name: 'Widget', unit_price: 9.99 },
  { id: 2, category_id: 2, product_name: 'Gadget', unit_price: 19.5 },
];

describe('ProductsPageComponent', () => {
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let afterClosedSubject: Subject<unknown>;
  let dialogRefStub: { afterClosed: () => Observable<unknown> };

  beforeEach(() => {
    productServiceSpy = jasmine.createSpyObj<ProductService>('ProductService', [
      'getAll',
      'create',
      'update',
      'delete',
    ]);
    productServiceSpy.getAll.and.returnValue(of(products));

    afterClosedSubject = new Subject<unknown>();
    dialogRefStub = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(dialogRefStub as MatDialogRef<unknown>);

    TestBed.configureTestingModule({
      imports: [ProductsPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProductService, useValue: productServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    });
  });

  function createComponent() {
    return TestBed.createComponent(ProductsPageComponent);
  }

  describe('ngOnInit / load', () => {
    it('should load products and toggle loading on success', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      expect(productServiceSpy.getAll).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance['products']()).toEqual(products);
      expect(fixture.componentInstance['loading']()).toBeFalse();
    });

    it('should set loading to false when the load request fails', () => {
      productServiceSpy.getAll.and.returnValue(throwError(() => new Error('boom')));

      const fixture = createComponent();
      fixture.detectChanges();

      expect(fixture.componentInstance['products']()).toEqual([]);
      expect(fixture.componentInstance['loading']()).toBeFalse();
    });
  });

  describe('openCreateDialog', () => {
    it('should open the form dialog with no product and reload after a successful create', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      productServiceSpy.getAll.calls.reset();

      const created: Product = { id: 3, category_id: 1, product_name: 'New', unit_price: 5 };
      productServiceSpy.create.and.returnValue(of(created));

      fixture.componentInstance.openCreateDialog();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        ProductFormComponent,
        jasmine.objectContaining({ data: { product: undefined } }),
      );

      afterClosedSubject.next({ product_name: 'New', unit_price: 5, category_id: 1 });

      expect(productServiceSpy.create).toHaveBeenCalledWith({ product_name: 'New', unit_price: 5, category_id: 1 });
      expect(productServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });

    it('should not call create nor reload when the dialog is cancelled', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      productServiceSpy.getAll.calls.reset();

      fixture.componentInstance.openCreateDialog();
      afterClosedSubject.next(undefined);

      expect(productServiceSpy.create).not.toHaveBeenCalled();
      expect(productServiceSpy.getAll).not.toHaveBeenCalled();
    });

    it('should not reload when the create request errors', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      productServiceSpy.getAll.calls.reset();

      productServiceSpy.create.and.returnValue(throwError(() => new Error('boom')));

      fixture.componentInstance.openCreateDialog();
      afterClosedSubject.next({ product_name: 'New', unit_price: 5, category_id: 1 });

      expect(productServiceSpy.create).toHaveBeenCalled();
      expect(productServiceSpy.getAll).not.toHaveBeenCalled();
    });
  });

  describe('openEditDialog', () => {
    it('should open the form dialog pre-filled with the product and reload after a successful update', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      productServiceSpy.getAll.calls.reset();

      const target = products[0];
      const updated: Product = { ...target, product_name: 'Updated' };
      productServiceSpy.update.and.returnValue(of(updated));

      fixture.componentInstance.openEditDialog(target);

      expect(dialogSpy.open).toHaveBeenCalledWith(
        ProductFormComponent,
        jasmine.objectContaining({ data: { product: target } }),
      );

      afterClosedSubject.next({ product_name: 'Updated', unit_price: target.unit_price, category_id: target.category_id });

      expect(productServiceSpy.update).toHaveBeenCalledWith(target.id, {
        product_name: 'Updated',
        unit_price: target.unit_price,
        category_id: target.category_id,
      });
      expect(productServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });

    it('should not call update nor reload when the dialog is cancelled', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      productServiceSpy.getAll.calls.reset();

      fixture.componentInstance.openEditDialog(products[0]);
      afterClosedSubject.next(undefined);

      expect(productServiceSpy.update).not.toHaveBeenCalled();
      expect(productServiceSpy.getAll).not.toHaveBeenCalled();
    });
  });

  describe('confirmDelete', () => {
    it('should open the confirm dialog and reload after a confirmed delete', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      productServiceSpy.getAll.calls.reset();

      const target = products[0];
      productServiceSpy.delete.and.returnValue(of(undefined));

      fixture.componentInstance.confirmDelete(target);

      expect(dialogSpy.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        jasmine.objectContaining({
          data: {
            title: 'Delete product',
            message: `Delete "${target.product_name}"? This cannot be undone.`,
          },
        }),
      );

      afterClosedSubject.next(true);

      expect(productServiceSpy.delete).toHaveBeenCalledWith(target.id);
      expect(productServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });

    it('should not call delete nor reload when the confirmation is declined', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      productServiceSpy.getAll.calls.reset();

      fixture.componentInstance.confirmDelete(products[0]);
      afterClosedSubject.next(false);

      expect(productServiceSpy.delete).not.toHaveBeenCalled();
      expect(productServiceSpy.getAll).not.toHaveBeenCalled();
    });

    it('should not reload when the delete request errors', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      productServiceSpy.getAll.calls.reset();

      productServiceSpy.delete.and.returnValue(throwError(() => new Error('boom')));

      fixture.componentInstance.confirmDelete(products[0]);
      afterClosedSubject.next(true);

      expect(productServiceSpy.delete).toHaveBeenCalled();
      expect(productServiceSpy.getAll).not.toHaveBeenCalled();
    });
  });
});
