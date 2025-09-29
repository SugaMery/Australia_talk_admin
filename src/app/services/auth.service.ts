import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  role_id?: number;
  user_id?: number;
  lettre?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(loginData: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, loginData).pipe(
      catchError(this.handleError)
    );
  }

  saveToken(token: string, role_id?: number, user_id?: number, rememberMe: boolean = false): void {
    if (rememberMe) {
      localStorage.setItem('token', token);
      if (role_id !== undefined) {
        localStorage.setItem('role_id', role_id.toString());
      }
      if (user_id !== undefined) {
        localStorage.setItem('user_id', user_id.toString());
      }
    } else {
      sessionStorage.setItem('token', token);
      if (role_id !== undefined) {
        sessionStorage.setItem('role_id', role_id.toString());
      }
      if (user_id !== undefined) {
        sessionStorage.setItem('user_id', user_id.toString());
      }
    }
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inattendue est survenue';
    if (error.status === 0) {
      errorMessage = 'Erreur réseau : Veuillez vérifier votre connexion';
    } else if (error.error) {
      errorMessage = error.error.error || 'Échec de la connexion';
      if (error.status === 401) {
        errorMessage = 'Nom d\'utilisateur/email ou mot de passe invalide';
      }
    }
    console.error('Erreur :', error);
    return throwError(() => new Error(errorMessage));
  }
}