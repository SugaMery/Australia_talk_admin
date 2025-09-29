import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface Artisan {
  id: number;
  name: string;
  last_name?: string;
  first_name?: string;
  phone?: string;
  phone_2?: string;
  email?: string;
  email_2?: string;
  address?: string;
  address_rest?: string;
  postal_code: string;
  city: string;
  note?: string;
  status: 'active' | 'blacklisted';
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ArtisanService {
  private apiUrl = `${environment.apiUrl}/artisans`;
  private token: string | null = localStorage.getItem('token');

  constructor(private http: HttpClient) {}

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    if (this.token) {
      headers = headers.set('Authorization', `Bearer ${this.token}`);
    }
    return headers;
  }

  getAll(): Observable<Artisan[]> {
    return this.http.get<Artisan[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getById(id: number): Observable<Artisan> {
    return this.http.get<Artisan>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  create(artisan: { name: string; last_name?: string; first_name?: string; phone?: string; phone_2?: string; email?: string; email_2?: string; address?: string; address_rest?: string; postal_code: string; city: string; note?: string; status?: 'active' | 'blacklisted' }): Observable<Artisan> {
    return this.http.post<Artisan>(this.apiUrl, artisan, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, artisan: { name: string; last_name?: string; first_name?: string; phone?: string; phone_2?: string; email?: string; email_2?: string; address?: string; address_rest?: string; postal_code: string; city: string; note?: string; status?: 'active' | 'blacklisted' }): Observable<Artisan> {
    return this.http.put<Artisan>(`${this.apiUrl}/${id}`, artisan, { headers: this.getHeaders() }).pipe(
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
        errorMessage = 'Non autorisé : Veuillez vous connecter';
        this.clearToken();
      } else if (error.status === 403) {
        errorMessage = 'Accès interdit : Jeton invalide';
        this.clearToken();
      } else if (error.status === 404) {
        errorMessage = 'Artisan non trouvé';
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