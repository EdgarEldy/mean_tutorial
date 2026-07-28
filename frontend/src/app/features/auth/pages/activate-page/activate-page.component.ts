import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type ActivationState = 'pending' | 'success' | 'error';

// Route-driven page for /auth/activate/:token: fires the activation call as soon as it loads,
// simulating a user clicking a link from an activation email.
@Component({
  selector: 'app-activate-page',
  imports: [MatCardModule, MatButtonModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './activate-page.component.html',
  styleUrl: './activate-page.component.css',
})
export class ActivatePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected readonly state = signal<ActivationState>('pending');

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token')!;
    this.authService.activate(token).subscribe({
      next: () => this.state.set('success'),
      error: () => this.state.set('error'),
    });
  }
}
