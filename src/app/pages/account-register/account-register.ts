import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface RegisterResponse {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  role: string;
  is_active: boolean;
}

@Component({
  selector: 'app-account-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './account-register.html',
  styleUrl: './account-register.scss'
})
export class AccountRegister {
  name = '';
  mobile = '';
  email = '';
  password = '';
  confirmPassword = '';

  loading = false;
  errorMessage = '';
  successMessage = '';

  private apiUrl = 'http://127.0.0.1:8000/api/auth';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name.trim()) {
      this.errorMessage = 'Please enter your name.';
      return;
    }

    if (!this.mobile.trim()) {
      this.errorMessage = 'Please enter your mobile number.';
      return;
    }

    if (!/^[0-9]{10}$/.test(this.mobile.trim())) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;

    const data = {
      name: this.name.trim(),
      mobile: this.mobile.trim(),
      email: this.email.trim() || null,
      password: this.password
    };

    this.http.post<RegisterResponse>(
      `${this.apiUrl}/register`,
      data
    ).subscribe({
      next: (response) => {
        console.log('Account created:', response);

        this.loading = false;
        this.successMessage =
          'Account created successfully! Please login.';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (error) => {
        console.error('Registration failed:', error);

        this.loading = false;
        this.errorMessage =
          error?.error?.detail ||
          'Account registration failed.';
      }
    });
  }
}