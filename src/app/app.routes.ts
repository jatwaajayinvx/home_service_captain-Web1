import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { AccountRegister } from './pages/account-register/account-register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Jobs } from './pages/jobs/jobs';
import { JobDetail } from './pages/job-detail/job-detail';
import { MyServices } from './pages/my-services/my-services';
import { Profile } from './pages/profile/profile';
import { ActiveJob } from './pages/active-job/active-job';
import { JobHistory } from './pages/job-history/job-history';

export const routes: Routes = [
    {
        path: 'login',
        component: Login
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'register',
        component: Register
    },
    {
        path: 'account-register',
        component: AccountRegister
    },
    {
        path: 'dashboard',
        component: Dashboard
    },
    {
        path: 'jobs',
        component: Jobs
    },
    {
        path: 'jobs/:bookingId',
        component: JobDetail
    },
    {
        path: 'my-services',
        component: MyServices
    },
    {
        path: 'profile',
        component: Profile
    },
    {
        path: 'active-job/:bookingId',
        component: ActiveJob
    },
    {
        path: 'jobs/history',
        component: JobHistory
    }
];
