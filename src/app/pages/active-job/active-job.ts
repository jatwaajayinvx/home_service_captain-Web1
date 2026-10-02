import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

interface ActiveJobInt {
    id: number;
    booking_number: string;
    customer_id: number;
    captain_id?: number;
    service_id: number;
    address_id: number;
    problem_description?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    estimated_amount: number;
    final_amount?: number;
    status: string;
    captain_name?: string;
}

@Component({
    selector: 'app-active-job',
    standalone: true,
    imports: [DecimalPipe, RouterLink],
    templateUrl: './active-job.html',
    styleUrl: './active-job.scss'
})
export class ActiveJob implements OnInit, OnDestroy {

    bookingId!: number;
    job: ActiveJobInt | null = null;

    loading = false;
    updating = false;

    errorMessage = '';
    successMessage = '';

    private bookingApiUrl =
        'http://127.0.0.1:8000/api/bookings';

    private captainApiUrl =
        'http://127.0.0.1:8000/api/captains';

    private refreshTimer: ReturnType<typeof setInterval> | null = null;

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {

        this.bookingId = Number(
            this.route.snapshot.paramMap.get('bookingId')
        );

        if (!this.bookingId) {
            this.errorMessage = 'Invalid booking ID.';
            this.loading = false;
            return;
        }

        this.loadJob();

        this.refreshTimer = setInterval(() => {
            this.loadJob(false);
        }, 5000);
    }

    ngOnDestroy(): void {

        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
    }

    private getHeaders(): HttpHeaders {

        const token = localStorage.getItem('access_token');

        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }

    loadJob(showLoader = true): void {

        const token = localStorage.getItem('access_token');

        if (!token) {
            this.router.navigate(['/login']);
            return;
        }

        if (showLoader) {
            this.loading = true;
        }

        this.http.get<ActiveJob>(
            `${this.captainApiUrl}/active-jobs/${this.bookingId}`,
            { headers: this.getHeaders() }
        )
            .pipe(finalize(() => this.loading = false))
            .subscribe({

                next: (response: any) => {
                    console.log('Active job loaded:', response);
                    this.job = response;
                    this.loading = false;
                    this.cdr.detectChanges();
                },

                error: (error) => {

                    console.error(
                        'Failed to load active job:',
                        error
                    );

                    this.loading = false;

                    this.errorMessage =
                        error?.error?.detail ||
                        'Unable to load active job.';
                }
            });
    }

    getNextStatus(): string | null {

        if (!this.job) {
            return null;
        }

        const nextStatuses: Record<string, string> = {
            ACCEPTED: 'ON_THE_WAY',
            ON_THE_WAY: 'ARRIVED',
            ARRIVED: 'STARTED',
            STARTED: 'COMPLETED'
        };

        return nextStatuses[this.job.status] || null;
    }

    getNextStatusLabel(): string {

        const labels: Record<string, string> = {
            ON_THE_WAY: 'Start Journey',
            ARRIVED: 'Mark Arrived',
            STARTED: 'Start Service',
            COMPLETED: 'Complete Job'
        };

        const nextStatus = this.getNextStatus();

        return nextStatus
            ? labels[nextStatus]
            : 'No Action';
    }

    updateStatus(): void {

        const nextStatus = this.getNextStatus();

        if (!nextStatus || this.updating) {
            return;
        }

        this.updating = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.http.put<ActiveJobInt>(
            `${this.bookingApiUrl}/${this.bookingId}/status`,
            {
                status: nextStatus
            },
            { headers: this.getHeaders() }
        ).subscribe({

            next: (response) => {

                this.job = response;
                this.updating = false;

                this.successMessage =
                    this.getSuccessMessage(nextStatus);

                this.cdr.detectChanges();

                if (nextStatus === 'COMPLETED') {

                    setTimeout(() => {
                        this.router.navigate([
                            '/dashboard'
                        ]);
                    }, 1500);
                }
            },

            error: (error) => {

                console.error(
                    'Failed to update job status:',
                    error
                );

                this.updating = false;

                this.errorMessage =
                    error?.error?.detail ||
                    'Unable to update job status.';
            }
        });
    }

    private getSuccessMessage(status: string): string {

        const messages: Record<string, string> = {
            ON_THE_WAY:
                'Customer has been notified that you are on the way.',

            ARRIVED:
                'Customer has been notified that you have arrived.',

            STARTED:
                'Service started successfully.',

            COMPLETED:
                'Job completed successfully.'
        };

        return messages[status] || 'Job status updated.';
    }

    getStatusClass(status: string): string {

        const classes: Record<string, string> = {
            ACCEPTED: 'status-accepted',
            ON_THE_WAY: 'status-on-the-way',
            ARRIVED: 'status-arrived',
            STARTED: 'status-started',
            COMPLETED: 'status-completed'
        };

        return classes[status] || 'status-default';
    }

    formatDate(date?: string): string {

        if (!date) {
            return 'Not scheduled';
        }

        const parsedDate =
            new Date(`${date}T00:00:00`);

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

        const [hours, minutes] =
            time.split(':');

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

    callCustomer(): void {

        if (!this.job?.customer_id) {
            return;
        }

        // Customer mobile is not returned by
        // the current booking detail endpoint.
        // Calling will be connected after adding
        // customer contact details to this endpoint.
        this.errorMessage =
            'Customer calling will be enabled after contact details are added.';
    }
}