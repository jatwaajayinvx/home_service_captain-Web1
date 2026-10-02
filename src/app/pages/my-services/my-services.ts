import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
interface ServiceItem {
    id: number;
    name: string;
    description?: string;
    base_price?: number;
    estimated_minutes?: number;
}
interface CaptainService {
    id: number;
    captain_id: number;
    service_id: number;
    experience_years: number;
}
@Component({
    selector: 'app-my-services',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './my-services.html',
    styleUrl: './my-services.scss',
})
export class MyServices implements OnInit {
    services: ServiceItem[] = [];
    captainServices: CaptainService[] = [];
    selectedServiceIds: number[] = [];
    experienceYears: Record<number, number> = {};
    loading = true;
    saving = false;
    errorMessage = '';
    successMessage = '';
    private apiUrl = 'http://127.0.0.1:8000/api';
    constructor(private http: HttpClient,
        private cdf: ChangeDetectorRef
    ) { }
    ngOnInit(): void {
        this.loadData();
    }
    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('access_token');
        return new HttpHeaders({
            Authorization: `Bearer ${token}`,
        });
    }
    loadData(): void {
        this.loading = true;
        this.errorMessage = '';
        this.http
            .get<any[]>(`${this.apiUrl}/service-categories`, { headers: this.getHeaders() })
            .subscribe({
                next: (categories) => {
                    this.loadAllServices(categories);
                    this.cdf.detectChanges();
                },
                error: (error) => {
                    console.error('Failed to load categories:', error);
                    this.loading = false;
                    this.errorMessage = error?.error?.detail || 'Unable to load services.';
                },
            });
        this.loadCaptainServices();
    }
    private loadAllServices(categories: any[]): void {
        if (!categories.length) {
            this.services = [];
            this.loading = false;
            return;
        }
        const allServices: ServiceItem[] = [];
        let completed = 0;
        categories.forEach((category) => {
            this.http
                .get<ServiceItem[]>(`${this.apiUrl}/services/category/${category.id}`, {
                    headers: this.getHeaders(),
                })
                .subscribe({
                    next: (services) => {
                        allServices.push(...services);
                        completed++;
                        if (completed === categories.length) {
                            this.services = allServices.sort((a, b) => a.id - b.id);
                            this.loading = false;
                            this.cdf.detectChanges();
                        }
                    },
                    error: (error) => {
                        console.error('Failed to load category services:', error);
                        completed++;
                        if (completed === categories.length) {
                            this.services = allServices;
                            this.loading = false;
                        }
                    },
                });
        });
    }
    loadCaptainServices(): void {
        this.http
            .get<CaptainService[]>(`${this.apiUrl}/captains/services`, { headers: this.getHeaders() })
            .subscribe({
                next: (response) => {
                    this.captainServices = response;
                    this.selectedServiceIds = response.map((item) => item.service_id);
                    response.forEach((item) => {
                        this.experienceYears[item.service_id] = item.experience_years;
                    });
                },
                error: (error) => {
                    console.error('Failed to load Captain services:', error);
                },
            });
    }
    isSelected(serviceId: number): boolean {
        return this.selectedServiceIds.includes(serviceId);
    }
    toggleService(serviceId: number): void {
        if (this.isSelected(serviceId)) {
            this.selectedServiceIds = this.selectedServiceIds.filter((id) => id !== serviceId);
        } else {
            this.selectedServiceIds = [...this.selectedServiceIds, serviceId];
            if (this.experienceYears[serviceId] === undefined) {
                this.experienceYears[serviceId] = 0;
            }
        }
        this.errorMessage = '';
        this.successMessage = '';
    }
    saveServices(): void {
        if (this.saving) {
            return;
        }
        if (this.selectedServiceIds.length === 0) {
            this.errorMessage = 'Please select at least one service.';
            return;
        }
        this.saving = true;
        this.errorMessage = '';
        this.successMessage = '';
        const newServiceIds = this.selectedServiceIds.filter(
            (serviceId) => !this.captainServices.some((item) => item.service_id === serviceId),
        );
        if (newServiceIds.length === 0) {
            this.saving = false;
            this.successMessage = 'Your services are already saved.';
            return;
        }
        let completed = 0;
        let failed = false;
        newServiceIds.forEach((serviceId) => {
            const experience = this.experienceYears[serviceId] ?? 0;
            this.http
                .post<CaptainService>(
                    `${this.apiUrl}/captains/services`,
                    {
                        service_id: serviceId,
                        experience_years: experience,
                    },
                    {
                        headers: this.getHeaders(),
                    },
                )
                .subscribe({
                    next: () => {
                        completed++;
                        if (completed === newServiceIds.length && !failed) {
                            this.saving = false;
                            this.successMessage = 'Services saved successfully!';
                            this.loadCaptainServices();
                        }
                    },
                    error: (error) => {
                        failed = true;
                        this.saving = false;
                        console.error('Failed to save service:', error);
                        this.errorMessage = error?.error?.detail || 'Unable to save service.';
                    },
                });
        });
    }
}
