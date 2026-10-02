import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
interface CaptainJobDetail {
    booking_id: number;
    booking_number: string;
    service_name: string;
    customer_name: string;
    customer_mobile: string;
    problem_description?: string;
    address_line: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    scheduled_date?: string;
    scheduled_time?: string;
    estimated_amount: number;
    distance_km: number;
    status: string;
}
interface BookingAcceptResponse {
    id: number;
    booking_number: string;
    customer_id: number;
    captain_id?: number;
    service_id: number;
    address_id: number;
    status: string;
    estimated_amount: number;
    final_amount?: number;
}
@Component({
    selector: 'app-job-detail',
    standalone: true,
    imports: [DecimalPipe, RouterLink],
    templateUrl: './job-detail.html',
    styleUrl: './job-detail.scss',
})
export class JobDetail implements OnInit {
    bookingId!: number;
    job: CaptainJobDetail | null = null;
    loading = true;
    accepting = false;
    errorMessage = '';
    successMessage = '';
    private captainApiUrl = 'http://127.0.0.1:8000/api/captains';
    private bookingApiUrl = 'http://127.0.0.1:8000/api/bookings';
    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }
    ngOnInit(): void {
        this.bookingId = Number(this.route.snapshot.paramMap.get('bookingId'));
        if (!this.bookingId) {
            this.errorMessage = 'Invalid booking ID.';
            this.loading = false;
            return;
        }
        this.loadJob();
    }
    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('access_token');
        return new HttpHeaders({
            Authorization: `Bearer ${token}`,
        });
    }
    loadJob(): void {
        const token = localStorage.getItem('access_token');
        if (!token) {
            this.router.navigate(['/login']);
            return;
        }
        this.loading = true;
        this.errorMessage = '';
        this.http
            .get<CaptainJobDetail>(`${this.captainApiUrl}/jobs/${this.bookingId}`, {
                headers: this.getHeaders(),
            })
            .subscribe({
                next: (response) => {
                    this.job = response;
                    this.loading = false;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error('Failed to load job:', error);
                    this.loading = false;
                    this.errorMessage = error?.error?.detail || 'Unable to load job details.';
                },
            });
    }
    acceptJob(): void {
        if (this.accepting || !this.job) {
            return;
        }
        this.accepting = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.http
            .post<BookingAcceptResponse>(
                `${this.bookingApiUrl}/${this.bookingId}/accept`,
                {},
                { headers: this.getHeaders() },
            )
            .subscribe({
                next: (response) => {
                    console.log('Job accepted:', response);
                    this.accepting = false;
                    this.successMessage = 'Job accepted successfully!';
                    setTimeout(() => {
                        this.router.navigate(['/active-job', this.bookingId
                        ]);
                    }, 800);
                    // this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error('Job acceptance failed:', error);
                    this.accepting = false;
                    this.errorMessage = error?.error?.detail || 'Unable to accept this job.';
                },
            });
    }
    formatDate(date?: string): string {
        if (!date) {
            return 'Not scheduled';
        }
        const parsedDate = new Date(`${date}T00:00:00`);
        return parsedDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }
    formatTime(time?: string): string {
        if (!time) {
            return 'Not specified';
        }
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(Number(hours), Number(minutes), 0, 0);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }
}
