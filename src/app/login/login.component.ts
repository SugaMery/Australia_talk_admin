import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router'; // Ajout

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  rememberMe: boolean = false;

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router // Ajout
  ) {}

  login() {
    if (!this.email || !this.password) {
      this.messageService.add({ severity: 'warn', summary: 'Champs requis', detail: 'Veuillez saisir votre email et mot de passe.' });
      return;
    }

    // Encode password en base64 si rememberMe
    if (this.rememberMe) {
      localStorage.setItem('remember_email', this.email);
      localStorage.setItem('remember_password', btoa(this.password));
    } else {
      localStorage.removeItem('remember_email');
      localStorage.removeItem('remember_password');
      sessionStorage.removeItem('remember_email');
      sessionStorage.removeItem('remember_password');
    }

    this.authService.login({ login: this.email, password: this.password }).subscribe({
      next: (res) => {
        if (res.token) {
          if (res.role_id === 1 || res.role_id === 2 || res.role_id === 3) {
            this.authService.saveToken(res.token, res.role_id, res.user_id, this.rememberMe);
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Connexion réussie !' });
            this.router.navigate(['/']); // Redirection
          } else {
            this.messageService.add({ severity: 'error', summary: 'Accès refusé', detail: 'Vous n\'avez pas accès à cette interface.' });
          }
        } else {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: res.error || 'Erreur de connexion.' });
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.message });
      }
    });
  }

  ngOnInit() {
    // Vérification SSR : window existe ?
    if (typeof window !== 'undefined') {
      const savedEmail = window.localStorage.getItem('remember_email');
      const savedPasswordEncoded = window.localStorage.getItem('remember_password');
      if (savedEmail && savedPasswordEncoded) {
        this.email = savedEmail;
        try {
          this.password = atob(savedPasswordEncoded);
        } catch {
          this.password = '';
        }
        this.rememberMe = true;
      }
    }
  }
}
