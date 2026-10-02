import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

interface CaptainJob {
  booking_id: number;
  booking_number: string;
  service_name: string;
  customer_name: string;
  problem_description?: string;
  address_line: string;
  city: string;
  scheduled_date?: string;
  scheduled_time?: string;
  estimated_amount: number;
  distance_km: number;
  status: string;
}

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './jobs.html',
  styleUrl: './jobs.scss'
})
export class Jobs implements OnInit {

  jobs: CaptainJob[] = [];

  loading = true;
  errorMessage = '';

  private apiUrl = 'http://127.0.0.1:8000/api/captains';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  loadJobs(): void {

    const token = localStorage.getItem('access_token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.http.get<CaptainJob[]>(
      `${this.apiUrl}/jobs`,
      { headers: this.getHeaders() }
    ).subscribe({

      next: (response) => {
        this.jobs = response;
        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'Failed to load jobs:',
          error
        );

        this.loading = false;

        this.errorMessage =
          error?.error?.detail ||
          'Unable to load available jobs.';
      }

    });
  }

  refreshJobs(): void {
    this.loadJobs();
  }

  formatDate(date?: string): string {

    if (!date) {
      return 'Not scheduled';
    }

    const parsedDate = new Date(`${date}T00:00:00`);

    return parsedDate.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
  }

  formatTime(time?: string): string {

    if (!time) {
      return 'Not specified';
    }

    const [hours, minutes] = time.split(':');

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  }
}