import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  experienceYears = 0;

  loading = false;
  errorMessage = '';
  successMessage = '';

  private apiUrl =
    'http://127.0.0.1:8000/api/captains';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  register(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (
      this.experienceYears < 0 ||
      this.experienceYears > 50
    ) {
      this.errorMessage =
        'Please enter valid experience years.';
      return;
    }

    const token =
      localStorage.getItem('access_token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.loading = true;

    this.http
      .post(
        `${this.apiUrl}/register`,
        {
          experience_years: this.experienceYears
        },
        { headers }
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'Captain registered:',
            response
          );

          this.loading = false;

          this.successMessage =
            'Captain profile created successfully!';

          const userData =
            localStorage.getItem('user');

          if (userData) {

            try {

              const user =
                JSON.parse(userData);

              user.role = 'CAPTAIN';

              localStorage.setItem(
                'user',
                JSON.stringify(user)
              );

            } catch (error) {
              console.error(
                'Failed to update user:',
                error
              );
            }
          }

          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        },

        error: (error) => {

          console.error(
            'Captain registration failed:',
            error
          );

          this.loading = false;

          this.errorMessage =
            error?.error?.detail ||
            'Captain registration failed.';
        }

      });
  }
}