import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service'; // Ajout import

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  inactiveUsersCount: number = 0;
  roles: any[] = [];
  selectedDate: any; // Ajout de la propriété pour corriger l'erreur
  searchTerm: string = '';

  constructor(
    private userService: UserService,
    private roleService: RoleService // Injection du service
  ) {}

  ngOnInit(): void {
    this.getAllUsers();
    this.getRoles();
  }

  getAllUsers() {
    this.userService.getAll().subscribe((users: any[]) => {
      this.users = users;
      //const count = this.users ? this.users.filter((u: any) => !!u.deleted_at).length : 0;
      //this.inactiveUsersCount = count < 10 ? `0${count}` : `${count}`;
      console.log('Utilisateurs chargés:', this.users);
    });
  }

  getRoles() {
    this.roleService.getAll().subscribe((roles: any[]) => {
      this.roles = roles;
      console.log('Rôles chargés:', this.roles);
    });
  }

  get inactiveUsersCountFormatted(): string {
    const count = Array.isArray(this.users)
      ? this.users.filter((u: any) => !!u.deleted_at).length
      : 0;
    return count < 10 ? `0${count}` : `${count}`;
  }

  get activeUsersCount(): string {
    const count = Array.isArray(this.users)
      ? this.users.filter((user: any) => !user.deleted_at).length
      : 0;
    return count < 10 ? `0${count}` : `${count}`;
  }

  public get superAdminCount(): string {
    const count = Array.isArray(this.users)
      ? this.users.filter((u: any) => u.role_name === 'Super Admin').length
      : 0;
    return count < 10 ? `0${count}` : `${count}`;
  }

  get filteredUsers(): any[] {
    if (!this.searchTerm || !Array.isArray(this.users)) {
      return this.users;
    }
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(u =>
      (u.full_name && u.full_name.toLowerCase().includes(term)) ||
      (u.first_name && u.first_name.toLowerCase().includes(term)) ||
      (u.last_name && u.last_name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.telephone && u.telephone.toLowerCase().includes(term))
    );
  }
}
