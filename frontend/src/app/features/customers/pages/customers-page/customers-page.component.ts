import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  CustomerFormComponent,
  CustomerFormDialogData,
} from '../../components/customer-form/customer-form.component';
import { CustomerListComponent } from '../../components/customer-list/customer-list.component';
import { Customer, CustomerInput } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';

// Route-level page for the customers resource.
// Owns the customer list state and coordinates the create/edit form dialog and the delete
// confirmation dialog, reloading the list after every successful mutation.
@Component({
  selector: 'app-customers-page',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, CustomerListComponent],
  templateUrl: './customers-page.component.html',
  styleUrl: './customers-page.component.css',
})
export class CustomersPageComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly dialog = inject(MatDialog);

  protected readonly customers = signal<Customer[]>([]);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  openCreateDialog(): void {
    this.openFormDialog();
  }

  openEditDialog(customer: Customer): void {
    this.openFormDialog(customer);
  }

  confirmDelete(customer: Customer): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Delete customer',
        message: `Delete this customer? This cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.customerService.delete(customer.id).subscribe({ next: () => this.load(), error: () => {} });
    });
  }

  private openFormDialog(customer?: Customer): void {
    const dialogRef = this.dialog.open<CustomerFormComponent, CustomerFormDialogData, CustomerInput>(
      CustomerFormComponent,
      { width: '480px', data: { customer } },
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const request = customer
        ? this.customerService.update(customer.id, result)
        : this.customerService.create(result);
      request.subscribe({ next: () => this.load(), error: () => {} });
    });
  }

  private load(): void {
    this.loading.set(true);
    this.customerService.getAll().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
