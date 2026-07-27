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
import { ProductFormComponent, ProductFormDialogData } from '../../components/product-form/product-form.component';
import { ProductListComponent } from '../../components/product-list/product-list.component';
import { Product, ProductInput } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

// Route-level page for the products resource.
// Owns the product list state and coordinates the create/edit form dialog and the delete
// confirmation dialog, reloading the list after every successful mutation.
@Component({
  selector: 'app-products-page',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, ProductListComponent],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.css',
})
export class ProductsPageComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  openCreateDialog(): void {
    this.openFormDialog();
  }

  openEditDialog(product: Product): void {
    this.openFormDialog(product);
  }

  confirmDelete(product: Product): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Delete product',
        message: `Delete "${product.product_name}"? This cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.productService.delete(product.id).subscribe({ next: () => this.load(), error: () => {} });
    });
  }

  private openFormDialog(product?: Product): void {
    const dialogRef = this.dialog.open<ProductFormComponent, ProductFormDialogData, ProductInput>(
      ProductFormComponent,
      { width: '480px', data: { product } },
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const request = product
        ? this.productService.update(product.id, result)
        : this.productService.create(result);
      request.subscribe({ next: () => this.load(), error: () => {} });
    });
  }

  private load(): void {
    this.loading.set(true);
    this.productService.getAll().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
