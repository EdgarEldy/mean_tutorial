import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Customer, CustomerInput } from '../../models/customer.model';

export interface CustomerFormDialogData {
  customer?: Customer;
}

// MatDialog content for creating or editing a single customer.
// Every field mirrors the backend's optional validation rules (customer.validation.js has no
// required() anywhere), so unlike category/product this form has no Validators.required at
// all, only format/length checks that Angular already skips for an empty value.
@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css',
})
export class CustomerFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CustomerFormComponent, CustomerInput>);
  protected readonly data = inject<CustomerFormDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = !!this.data.customer;

  protected readonly form = this.fb.nonNullable.group({
    first_name: [this.data.customer?.first_name ?? '', [Validators.maxLength(255)]],
    last_name: [this.data.customer?.last_name ?? '', [Validators.maxLength(255)]],
    telephone: [
      this.data.customer?.telephone ?? '',
      [Validators.maxLength(50), Validators.pattern(/^[0-9+\-.\s()]*$/)],
    ],
    email: [this.data.customer?.email ?? '', [Validators.maxLength(255), Validators.email]],
    address: [this.data.customer?.address ?? '', [Validators.maxLength(255)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.stripBlankFields(this.form.getRawValue()));
  }

  // express-validator's .optional() only skips a field when the key is absent, not when it's
  // present as an empty string, so `email: ''` would still fail isEmail() server-side. Every
  // control here defaults to '' when left blank, so blank fields are dropped entirely instead
  // of being sent as empty strings.
  private stripBlankFields(raw: Record<string, string>): CustomerInput {
    return Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== '')) as CustomerInput;
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
