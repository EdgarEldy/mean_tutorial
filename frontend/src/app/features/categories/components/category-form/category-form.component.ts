import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Category, CategoryInput } from '../../models/category.model';

export interface CategoryFormDialogData {
  category?: Category;
}

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.css',
})
// MatDialog content for creating or editing a single category.
// Only validates and returns the form value, the caller decides whether to create or update.
export class CategoryFormComponent {
  private readonly fb = inject(FormBuilder);
  // MatDialogRef<T, D, R>: T is this component, D is the data passed in via MAT_DIALOG_DATA,
  // R is what dialogRef.close(result) hands back to whoever called dialog.open().
  private readonly dialogRef = inject(MatDialogRef<CategoryFormComponent, CategoryInput>);
  // Data injected by whoever opened this dialog, undefined category means create mode.
  protected readonly data = inject<CategoryFormDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = !!this.data.category;

  protected readonly form = this.fb.nonNullable.group({
    category_name: [
      this.data.category?.category_name ?? '',
      [Validators.required, Validators.maxLength(255)],
    ],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
