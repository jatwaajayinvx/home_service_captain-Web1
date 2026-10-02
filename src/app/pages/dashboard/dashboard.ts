import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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

interface EarningsSummary {
    total_bookings: number;
    total_booking_amount: number;
    total_commission: number;
    total_earnings: number;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

    captain: any;
    earnings: EarningsSummary | null = null;

    loading = true;
    statusLoading = false;
    locationLoading = false;

    errorMessage = '';
    statusMessage = '';

    private apiUrl = 'http://127.0.0.1:8000/api/captains';

    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadDashboard();
    }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('access_token');

        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }

    loadDashboard(): void {

        const token = localStorage.getItem('access_token');

        if (!token) {
            this.router.navigate(['/login']);
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        this.http.get<Captain>(
            `${this.apiUrl}/me`,
            { headers: this.getHeaders() }
        ).subscribe({

            next: (captain) => {
                this.captain = captain;
                this.loading = false;
                this.cdr.detectChanges();
                this.loadEarnings();
            },

            error: (error) => {

                console.error(
                    'Failed to load captain profile:',
                    error
                );

                this.loading = false;

                this.errorMessage =
                    error?.error?.detail ||
                    'Unable to load Captain profile.';
            }

        });
    }

    loadEarnings(): void {

        this.http.get<EarningsSummary>(
            `${this.apiUrl}/earnings/summary`,
            { headers: this.getHeaders() }
        ).subscribe({

            next: (response) => {
                this.earnings = response;
                this.cdr.detectChanges();
            },

            error: (error) => {
                console.error(
                    'Failed to load earnings:',
                    error
                );
            }

        });
    }

    toggleAvailability(): void {

        if (!this.captain || this.statusLoading) {
            return;
        }

        if (this.captain.kyc_status !== 'VERIFIED') {
            this.statusMessage =
                'KYC must be verified before going online.';
            return;
        }

        const goingOnline =
            this.captain.availability_status !== 'ONLINE';

        const newStatus = goingOnline
            ? 'ONLINE'
            : 'OFFLINE';

        this.statusLoading = true;
        this.statusMessage = '';
        this.errorMessage = '';

        if (goingOnline) {
            this.updateLocationAndGoOnline(newStatus);
        } else {
            this.updateStatus(newStatus);
        }
    }

    private updateLocationAndGoOnline(
        newStatus: 'ONLINE' | 'OFFLINE'
    ): void {

        if (!navigator.geolocation) {
            this.statusLoading = false;
            this.errorMessage =
                'Location is not supported by this browser.';
            return;
        }

        this.locationLoading = true;

        navigator.geolocation.getCurrentPosition(

            (position) => {

                this.locationLoading = false;

                const locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                this.http.put<Captain>(
                    `${this.apiUrl}/location`,
                    locationData,
                    { headers: this.getHeaders() }
                ).subscribe({

                    next: (captain) => {
                        this.captain = captain;
                        this.updateStatus(newStatus);
                        this.cdr.detectChanges();
                    },

                    error: (error) => {

                        this.statusLoading = false;

                        console.error(
                            'Location update failed:',
                            error
                        );

                        this.errorMessage =
                            error?.error?.detail ||
                            'Unable to update your location.';
                    }

                });
            },

            (error) => {

                this.locationLoading = false;
                this.statusLoading = false;

                console.error(
                    'Location permission failed:',
                    error
                );

                if (error.code === 1) {
                    this.errorMessage =
                        'Location permission is required to go online.';
                } else {
                    this.errorMessage =
                        'Unable to get your current location.';
                }
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
    }

    private updateStatus(
        newStatus: 'ONLINE' | 'OFFLINE'
    ): void {

        this.http.put<Captain>(
            `${this.apiUrl}/status`,
            {
                availability_status: newStatus
            },
            { headers: this.getHeaders() }
        ).subscribe({

            next: (captain) => {
                
                this.captain = captain;
                this.statusLoading = false;

                this.statusMessage =
                    newStatus === 'ONLINE'
                        ? 'You are now ONLINE.'
                        : 'You are now OFFLINE.';
                this.cdr.detectChanges();
            },

            error: (error) => {

                this.statusLoading = false;

                console.error(
                    'Status update failed:',
                    error
                );

                this.errorMessage =
                    error?.error?.detail ||
                    'Unable to update availability status.';
            }

        });
    }

    getCaptainName(): string {

        const userData = localStorage.getItem('user');

        if (!userData) {
            return 'Captain';
        }

        try {
            const user = JSON.parse(userData);
            return user.name || 'Captain';
        } catch {
            return 'Captain';
        }
    }

    getKycClass(): string {

        if (this.captain?.kyc_status === 'VERIFIED') {
            return 'text-success';
        }

        if (this.captain?.kyc_status === 'REJECTED') {
            return 'text-danger';
        }

        return 'text-warning';
    }

    logout(): void {

        localStorage.removeItem('access_token');
        localStorage.removeItem('user');

        this.router.navigate(['/login']);
    }
}