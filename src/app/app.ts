import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet,
        RouterLink,
        RouterLinkActive],
    templateUrl: './app.html',
    styleUrl: './app.scss'
})
export class App {
    protected readonly title = signal('captain-app');
    constructor(
        private router: Router
    ) { }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('access_token');
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

    logout(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');

        this.router.navigate(['/login']);
    }
}
