import { Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';

// Depends only on core/ (AuthStateService), not on the auth feature: logout lives on
// AuthStateService itself so this shared component never has to import from a feature.
@Component({
  selector: 'app-topbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  readonly menuToggle = output<void>();

  protected readonly isAuthenticated = this.authState.isAuthenticated;
  protected readonly user = this.authState.user;

  logout(): void {
    this.authState.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
