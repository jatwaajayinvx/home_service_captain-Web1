import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  AuthService
} from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  mobile = '';
  password = '';

  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdf: ChangeDetectorRef
  ) {}

  login(): void {

    if (!this.mobile || !this.password) {
      this.errorMessage =
        'Please enter mobile and password.';
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    this.authService
      .login(this.mobile, this.password)
      .subscribe({

        next: (response) => {

          localStorage.setItem(
            'access_token',
            response.access_token
          );

          localStorage.setItem(
            'user',
            JSON.stringify(response.user)
          );

          this.loading = false;

          // Already Captain
          if (response.user.role === 'CAPTAIN') {
            this.router.navigate(['/dashboard']);
            return;
          }

          // Normal Customer account
          if (response.user.role === 'CUSTOMER') {
            this.router.navigate(['/register']);
            return;
          }

          this.errorMessage =
            'This account cannot be used in Captain App.';

          localStorage.removeItem('access_token');
          localStorage.removeItem('user');

          this.cdf.detectChanges();
        },

        error: (error) => {

          console.error(
            'Captain login failed:',
            error
          );

          this.loading = false;

          this.errorMessage =
            error?.error?.detail ||
            'Login failed. Please check your credentials.';

          this.cdf.detectChanges();
        }

      });
  }
}