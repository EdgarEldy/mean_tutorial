import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable, map, shareReplay } from 'rxjs';
// Cross-feature import, sanctioned only for a form that needs a related resource's dropdown
// (here: the category a product belongs to).
import { Category } from '../../../categories/models/category.model';
import { CategoryService } from '../../../categories/services/category.service';
import { Product, ProductInput } from '../../models/product.model';

export interface ProductFormDialogData {
  product?: Product;
}

@Component({
  selector: 'app-product-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css',
})
// MatDialog content for creating or editing a single product.
// Only validates and returns the form value, the caller decides whether to create or update.
export class ProductFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly dialogRef = inject(MatDialogRef<ProductFormComponent, ProductInput>);
  protected readonly data = inject<ProductFormDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = !!this.data.product;

  // shareReplay(1) caches the one HTTP call so both the template (via toSignal) and the async
  // validator below read the same result instead of the validator triggering its own request.
  private readonly categories$ = this.categoryService.getAll().pipe(shareReplay(1));

  // toSignal subscribes once and exposes the latest emission as a signal, so the template
  // can read categories() without an async pipe or a manual subscribe/unsubscribe.
  protected readonly categories = toSignal(this.categories$, { initialValue: [] as Category[] });

  protected readonly form = this.fb.nonNullable.group({
    product_name: [
      this.data.product?.product_name ?? '',
      [Validators.required, Validators.maxLength(255)],
    ],
    unit_price: [this.data.product?.unit_price ?? 0, [Validators.required, Validators.min(0)]],
    category_id: [
      this.data.product?.category_id ?? 0,
      [Validators.required, Validators.min(1)],
      [this.categoryStillExistsValidator()],
    ],
  });

  submit(): void {
    // form.invalid is only true once status is INVALID, so a still-resolving async validator
    // (status PENDING) would slip through without this extra check.
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }

  cancel(): void {
    this.dialogRef.close();
  }

  // AsyncValidatorFn must return an Observable/Promise of ValidationErrors|null. This waits on
  // categories$ itself (not a signal snapshot) so it doesn't fire a false "not found" before
  // the category list has actually loaded, e.g. right when the dialog opens in edit mode.
  // The dropdown only ever offers existing categories, but this still guards against picking
  // one that was deleted by someone else between page load and submit.
  private categoryStillExistsValidator(): AsyncValidatorFn {
    return (control): Observable<ValidationErrors | null> =>
      this.categories$.pipe(
        map((categories) =>
          categories.some((category) => category.id === control.value) ? null : { categoryNotFound: true },
        ),
      );
  }
}
