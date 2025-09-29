import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface User {
  id: number;
  user_name: string;
  email: string;
  last_name: string;
  first_name: string;
  role_id?: number;
  uuid: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  last_name: string;
  first_name: string;
  user_name?: string;
  role_id?: number;
}

export interface UserResponse {
  message?: string;
  user?: User;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private token: string | null = localStorage.getItem('token'); // Store token in localStorage

  constructor(private http: HttpClient) {}

  // Set token (e.g., after login)
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token); // Persist token
  }

  // Clear token (e.g., on logout)
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Get headers with Authorization token
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    if (this.token) {
      console.log('Using token:', this.token);
      headers = headers.set('Authorization', `Bearer ${this.token}`);
    }
    return headers;
  }

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  create(user: RegisterRequest): Observable<User> {
    return this.http.post<UserResponse>(this.apiUrl, user, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response.user) return response.user;
        throw new Error(response.error || 'Failed to create user');
      }),
      catchError(this.handleError)
    );
  }

  register(user: RegisterRequest): Observable<User> {
    // Registration doesn't require a token
    return this.http.post<UserResponse>(`${this.apiUrl}/register`, user).pipe(
      map(response => {
        if (response.user) return response.user;
        throw new Error(response.error || 'Failed to register user');
      }),
      catchError(this.handleError)
    );
  }

  update(id: number, user: Partial<RegisterRequest>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inattendue est survenue';
    if (error.status === 0) {
      errorMessage = 'Erreur réseau : Veuillez vérifier votre connexion';
    } else if (error.error) {
      if (error.status === 401) {
        errorMessage = 'Non autorisé : Veuillez vous connecter ou rafraîchir votre jeton';
        this.clearToken(); // Clear invalid token
      } else if (error.status === 403) {
        errorMessage = 'Accès interdit : Jeton invalide';
        this.clearToken(); // Clear invalid token
      } else if (error.status === 404) {
        errorMessage = 'Utilisateur non trouvé';
      } else if (error.status === 409) {
        errorMessage = error.error.error || 'Conflit : Email ou nom d\'utilisateur déjà existant';
      } else if (error.status === 400) {
        errorMessage = error.error.errors ? error.error.errors.map((err: any) => err.msg).join(', ') : 'Entrée invalide';
      } else {
        errorMessage = error.error.error || 'Erreur du serveur';
      }
    }
    console.error('Erreur :', error);
    return throwError(() => new Error(errorMessage));
  }
}