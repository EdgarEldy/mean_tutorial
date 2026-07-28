import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CategoryFormComponent, CategoryFormDialogData } from '../../components/category-form/category-form.component';
import { CategoryListComponent } from '../../components/category-list/category-list.component';
import { Category, CategoryInput } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-categories-page',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, CategoryListComponent],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.css',
})
// Route-level page for the categories resource.
// Owns the category list state and coordinates the create/edit form dialog and the delete
// confirmation dialog, reloading the list after every successful mutation.
export class CategoriesPageComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly authState = inject(AuthStateService);

  // signal() holds local page state; the template reads it by calling categories()/loading(),
  // and .set() below is what triggers a re-render, no async pipe or manual change detection needed.
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(false);
  protected readonly isAdmin = this.authState.isAdmin;

  ngOnInit(): void {
    this.load();
  }

  openCreateDialog(): void {
    this.openFormDialog();
  }

  openEditDialog(category: Category): void {
    this.openFormDialog(category);
  }

  confirmDelete(category: Category): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Delete category',
        message: `Delete "${category.category_name}"? This cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.categoryService.delete(category.id).subscribe({ next: () => this.load(), error: () => {} });
    });
  }

  private openFormDialog(category?: Category): void {
    const dialogRef = this.dialog.open<CategoryFormComponent, CategoryFormDialogData, CategoryInput>(
      CategoryFormComponent,
      { width: '480px', data: { category } },
    );

    // afterClosed() emits once with the value passed to dialogRef.close() (or undefined on
    // cancel/backdrop click), then completes, this is the only place the mutation is triggered.
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const request = category
        ? this.categoryService.update(category.id, result)
        : this.categoryService.create(result);
      request.subscribe({ next: () => this.load(), error: () => {} });
    });
  }

  private load(): void {
    this.loading.set(true);
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
