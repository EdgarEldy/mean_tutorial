import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { shareReplay } from 'rxjs';
// Cross-feature imports, sanctioned only for a form that needs another resource's dropdown.
// This form needs two: the customer placing the order and the product being ordered.
import { Customer } from '../../../customers/models/customer.model';
import { CustomerService } from '../../../customers/services/customer.service';
import { Product } from '../../../products/models/product.model';
import { ProductService } from '../../../products/services/product.service';
import { Order, OrderInput } from '../../models/order.model';

export interface OrderFormDialogData {
  order?: Order;
}

// MatDialog content for creating or editing a single order. Reactive form with customer_id,
// product_id, and quantity, all required + min(1), mirroring order.validation.js.
@Component({
  selector: 'app-order-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css',
})
export class OrderFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly dialogRef = inject(MatDialogRef<OrderFormComponent, OrderInput>);
  protected readonly data = inject<OrderFormDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = !!this.data.order;

  protected readonly customers = toSignal(this.customerService.getAll().pipe(shareReplay(1)), {
    initialValue: [] as Customer[],
  });
  protected readonly products = toSignal(this.productService.getAll().pipe(shareReplay(1)), {
    initialValue: [] as Product[],
  });

  // The order's nested customer/product ids come back from GraphQL as strings (see
  // order.model.ts), but the dropdown options below are populated from the REST
  // CustomerService/ProductService where ids are numbers, so Number(...) is required here or
  // mat-select's strict-equality value matching would never select the pre-filled option.
  protected readonly form = this.fb.nonNullable.group({
    customer_id: [Number(this.data.order?.customer?.id) || 0, [Validators.required, Validators.min(1)]],
    product_id: [Number(this.data.order?.product?.id) || 0, [Validators.required, Validators.min(1)]],
    quantity: [this.data.order?.quantity ?? 1, [Validators.required, Validators.min(1)]],
  });

  // toSignal over valueChanges turns each control into a signal so total can be a computed()
  // instead of a manual subscription + instance field kept in sync by hand.
  private readonly productIdChanges = toSignal(this.form.controls.product_id.valueChanges, {
    initialValue: this.form.controls.product_id.value,
  });
  private readonly quantityChanges = toSignal(this.form.controls.quantity.valueChanges, {
    initialValue: this.form.controls.quantity.value,
  });

  // Recomputed only when the selected product or the quantity actually changes, deriving the
  // live total (quantity x product.unit_price) the same way the backend computes it on save.
  protected readonly total = computed(() => {
    const product = this.products().find((candidate) => candidate.id === this.productIdChanges());
    const quantity = this.quantityChanges();
    return product && quantity > 0 ? product.unit_price * quantity : 0;
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

  protected customerLabel(customer: Customer): string {
    const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ');
    return name || `Customer #${customer.id}`;
  }

  protected productLabel(product: Product): string {
    return `${product.product_name} ($${product.unit_price.toFixed(2)})`;
  }
}
