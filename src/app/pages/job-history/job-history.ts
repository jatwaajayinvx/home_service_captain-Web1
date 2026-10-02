import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

interface JobHistoryInt {
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
  final_amount?: number;
  status: string;
  completed_at?: string;
}

@Component({
  selector: 'app-job-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './job-history.html',
  styleUrl: './job-history.scss',
})
export class JobHistory implements OnInit {

  jobs: JobHistoryInt[] = [];

  loading = true;
  errorMessage = '';

  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadJobHistory();
  }

  loadJobHistory(): void {
    this.loading = true;
    this.errorMessage = '';

    const token = localStorage.getItem('access_token');

    if (!token) {
      this.loading = false;
      this.errorMessage = 'Please login again.';
      return;
    }

    this.http.get<JobHistoryInt[]>(
      `${this.apiUrl}/captains/jobs/history`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ).subscribe({
      next: (response) => {
        this.jobs = response;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Job history error:', error);

        this.loading = false;
        this.errorMessage =
          error?.error?.detail ||
          'Unable to load job history.';
      },
    });
  }

  getAmount(job: JobHistoryInt): number {
    return job.final_amount ?? job.estimated_amount ?? 0;
  }
}