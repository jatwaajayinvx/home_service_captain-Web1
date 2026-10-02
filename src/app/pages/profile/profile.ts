import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

interface Captain {
  id: number;
  user_id: number;
  experience_years: number;
  kyc_status: string;
  availability_status: string;
  current_latitude?: number;
  current_longitude?: number;
  rating: number;
  total_jobs: number;
  completed_jobs: number;
}

interface User {
  name: string;
  mobile: string;
  email?: string;
  role: string;
  is_active: boolean;
}

interface CaptainProfileUpdateResponse {
  message: string;
  name: string;
  mobile: string;
  email?: string;
  experience_years: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    FormsModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {

  user: User | null = null;
  captain: Captain | null = null;

  loading = true;
  saving = false;

  errorMessage = '';
  successMessage = '';

  editMode = false;

  editName = '';
  editEmail = '';
  editExperience = 0;

  private apiUrl = 'http://127.0.0.1:8000/api/captains';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdf: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadCaptain();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private loadUser(): void {

    const userData = localStorage.getItem('user');

    if (!userData) {
      return;
    }

    try {
      this.user = JSON.parse(userData);
    } catch {
      this.user = null;
    }
  }

  private loadCaptain(): void {

    const token = localStorage.getItem('access_token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.http.get<Captain>(
      `${this.apiUrl}/me`,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (response) => {

        this.captain = response;
        this.loading = false;

        this.cdf.detectChanges();
      },

      error: (error) => {

        console.error(
          'Failed to load Captain profile:',
          error
        );

        this.loading = false;

        this.errorMessage =
          error?.error?.detail ||
          'Unable to load Captain profile.';

        this.cdf.detectChanges();
      }

    });
  }

  getKycClass(): string {

    if (this.captain?.kyc_status === 'VERIFIED') {
      return 'bg-success';
    }

    if (this.captain?.kyc_status === 'REJECTED') {
      return 'bg-danger';
    }

    return 'bg-warning text-dark';
  }

  getAvailabilityClass(): string {

    if (this.captain?.availability_status === 'ONLINE') {
      return 'bg-success';
    }

    if (this.captain?.availability_status === 'BUSY') {
      return 'bg-warning text-dark';
    }

    return 'bg-secondary';
  }

  startEdit(): void {

    this.errorMessage = '';
    this.successMessage = '';

    this.editName = this.user?.name || '';
    this.editEmail = this.user?.email || '';
    this.editExperience =
      this.captain?.experience_years || 0;

    this.editMode = true;

    this.cdf.detectChanges();
  }

  cancelEdit(): void {

    this.editMode = false;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdf.detectChanges();
  }

  saveProfile(): void {

    this.errorMessage = '';
    this.successMessage = '';

    const name = this.editName.trim();
    const email = this.editEmail.trim();

    if (!name) {

      this.errorMessage = 'Name is required.';
      return;
    }

    if (name.length < 2) {

      this.errorMessage =
        'Name must be at least 2 characters.';

      return;
    }

    if (
      this.editExperience < 0 ||
      this.editExperience > 50
    ) {

      this.errorMessage =
        'Experience must be between 0 and 50 years.';

      return;
    }

    const payload = {
      name: name,
      email: email,
      experience_years: this.editExperience
    };

    this.saving = true;

    this.http.put<CaptainProfileUpdateResponse>(
      `${this.apiUrl}/me`,
      payload,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (response) => {

        this.saving = false;
        this.editMode = false;

        /*
         * Update local user information
         */
        if (this.user) {

          this.user.name = response.name;
          this.user.email = response.email;

          localStorage.setItem(
            'user',
            JSON.stringify(this.user)
          );
        }

        /*
         * Update Captain information
         */
        if (this.captain) {

          this.captain.experience_years =
            response.experience_years;
        }

        this.successMessage =
          response.message ||
          'Profile updated successfully.';

        this.cdf.detectChanges();
      },

      error: (error) => {

        console.error(
          'Profile update failed:',
          error
        );

        this.saving = false;

        this.errorMessage =
          error?.error?.detail ||
          'Unable to update profile.';

        this.cdf.detectChanges();
      }

    });
  }

  logout(): void {

    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    this.router.navigate(['/login']);
  }
}