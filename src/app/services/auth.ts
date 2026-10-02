import { Injectable } from '@angular/core';
import {
  HttpClient
} from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    mobile: string;
    email?: string;
    role: string;
    is_active: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl =
    'http://127.0.0.1:8000/api/auth';

  constructor(
    private http: HttpClient
  ) {}

  login(
    mobile: string,
    password: string
  ): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      {
        mobile,
        password
      }
    );
  }
}