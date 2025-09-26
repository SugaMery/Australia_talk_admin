import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;

  login() {
    // Ajoutez ici la logique de connexion à Australia Talk
    // Par exemple, vérification des champs et appel à un service d'authentification
    if (!this.email || !this.password) {
      alert('Veuillez saisir votre email et mot de passe.');
      return;
    }
    // Exemple de logique (à remplacer par votre propre service)
    // this.authService.login(this.email, this.password).subscribe(...)
    console.log('Tentative de connexion avec', this.email, this.password);
  }
}
