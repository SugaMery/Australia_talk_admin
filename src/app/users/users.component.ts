import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';

export interface EditUser {
  email: string;
  password: string;
  confirmPassword?: string;
  last_name: string;
  first_name: string;
  user_name?: string;
  role_id?: number;
  telephone?: string;
  city?: string;
  code_postal?: string;
  device_type?: string;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  roles: any[] = [];
  cities = [
    { nom: 'Paris', code_postal: '75000' },
    { nom: 'Lyon', code_postal: '69000' },
    { nom: 'Marseille', code_postal: '13000' },
    { nom: 'Toulouse', code_postal: '31000' },
    { nom: 'Nice', code_postal: '06000' },
    { nom: 'Nantes', code_postal: '44000' },
    { nom: 'Strasbourg', code_postal: '67000' },
    { nom: 'Montpellier', code_postal: '34000' },
    { nom: 'Bordeaux', code_postal: '33000' },
    { nom: 'Lille', code_postal: '59000' },
    { nom: 'Rennes', code_postal: '35000' },
    { nom: 'Reims', code_postal: '51100' },
    { nom: 'Le Havre', code_postal: '76600' },
    { nom: 'Saint-Étienne', code_postal: '42000' },
    { nom: 'Toulon', code_postal: '83000' },
    { nom: 'Grenoble', code_postal: '38000' },
    { nom: 'Dijon', code_postal: '21000' },
    { nom: 'Angers', code_postal: '49000' },
    { nom: 'Villeurbanne', code_postal: '69100' },
    { nom: 'Nîmes', code_postal: '30000' },
    { nom: 'Clermont-Ferrand', code_postal: '63000' },
    { nom: 'Le Mans', code_postal: '72000' },
    { nom: 'Aix-en-Provence', code_postal: '13100' },
    { nom: 'Brest', code_postal: '29200' },
    { nom: 'Limoges', code_postal: '87000' },
    { nom: 'Tours', code_postal: '37000' },
    { nom: 'Amiens', code_postal: '80000' },
    { nom: 'Perpignan', code_postal: '66000' },
    { nom: 'Metz', code_postal: '57000' },
    { nom: 'Besançon', code_postal: '25000' },
    { nom: 'Orléans', code_postal: '45000' },
    { nom: 'Caen', code_postal: '14000' },
    { nom: 'Mulhouse', code_postal: '68100' },
    { nom: 'Rouen', code_postal: '76000' },
    { nom: 'Nancy', code_postal: '54000' },
    { nom: 'Saint-Malo', code_postal: '35400' },
    { nom: 'Annecy', code_postal: '74000' },
    { nom: 'Avignon', code_postal: '84000' },
    { nom: 'La Rochelle', code_postal: '17000' },
    { nom: 'Vannes', code_postal: '56000' },
    { nom: 'Pau', code_postal: '64000' },
    { nom: 'Bayonne', code_postal: '64100' },
    { nom: 'Arles', code_postal: '13200' },
    { nom: 'Carcassonne', code_postal: '11000' },
    { nom: 'Albi', code_postal: '81000' }
  ];

  filteredCities: any[] = [];
  searchTerm: string = '';
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedUser: any = {};
  selectedDate: any;
  editUser: EditUser = {
    email: '',
    password: '',
    confirmPassword: '',
    last_name: '',
    first_name: '',
    user_name: '',
    role_id: undefined,
    telephone: '',
    city: '',
    code_postal: '',
    device_type: ''
  };

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  deviceTypes = [
    { label: 'Android', value: 'Android' },
    { label: 'iOS', value: 'iOS' },
    { label: 'Web', value: 'Web' },
    { label: 'Windows', value: 'Windows' },
    { label: 'Mac', value: 'Mac' }
  ];

  constructor(
    private userService: UserService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    this.getAllUsers();
    this.getRoles();
  }

  getAllUsers() {
    this.userService.getAll().subscribe({
      next: (users: any[]) => {
        this.users = users;
        this.filteredUsers = users;
        console.log('Utilisateurs chargés:', this.users);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    });
  }

  getRoles() {
    this.roleService.getAll().subscribe({
      next: (roles: any[]) => {
        this.roles = roles;
        console.log('Rôles chargés:', this.roles);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rôles:', error);
      }
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

  filterUsers() {
    if (!this.searchTerm || !Array.isArray(this.users)) {
      this.filteredUsers = this.users;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      (u.full_name && u.full_name.toLowerCase().includes(term)) ||
      (u.first_name && u.first_name.toLowerCase().includes(term)) ||
      (u.last_name && u.last_name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.telephone && u.telephone.toLowerCase().includes(term))
    );
  }

  filterCities(event: any) {
    const query = event.query.toLowerCase();
    this.filteredCities = this.cities.filter(city =>
      city.nom.toLowerCase().includes(query)
    );
  }

  onCitySelected(city: any) {
    if (city && city.code_postal) {
      this.selectedUser.code_postal = city.code_postal;
    } else {
      this.selectedUser.code_postal = '';
    }
  }

  openEditUserModal(user: any) {
    this.selectedUser = {
      ...user,
      status: user.deleted_at ? 'inactive' : 'active',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      telephoneुसार: user.telephone || '',
      city: user.city || '',
      code_postal: user.code_postal || '',
      device_type: user.device_type || '',
      role_id: user.role_id || undefined,
      password: '', // Initialize as empty to avoid pre-filling
      confirmPassword: '' // Initialize as empty to avoid pre-filling
    };
    this.showEditModal = true;
  }

  closeEditUserModal() {
    this.showEditModal = false;
    this.selectedUser = {};
  }

  saveUserChanges() {
    // Validate password and confirmPassword match if provided
    if (this.selectedUser.password && this.selectedUser.password !== this.selectedUser.confirmPassword) {
      console.error('Les mots de passe ne correspondent pas');
      // Optionally, add a toast notification here
      return;
    }

    const updatedUser: Partial<EditUser> = {
      first_name: this.selectedUser.first_name,
      last_name: this.selectedUser.last_name,
      email: this.selectedUser.email,
      telephone: this.selectedUser.telephone,
      city: this.selectedUser.city,
      code_postal: this.selectedUser.code_postal,
      device_type: this.selectedUser.device_type,
      role_id: this.selectedUser.role_id,
      password: this.selectedUser.password || undefined // Only include password if provided
    };

    this.userService.update(this.selectedUser.id, updatedUser).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...updatedUser };
          this.filteredUsers = [...this.users];
        }
        this.closeEditUserModal();
        console.log('Utilisateur mis à jour:', updatedUser);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      }
    });
  }

  openDeleteUserModal(user: any) {
    this.selectedUser = { ...user };
    this.showDeleteModal = true;
  }

  closeDeleteUserModal() {
    this.showDeleteModal = false;
    this.selectedUser = {};
  }

  deleteUser() {
    this.userService.delete(this.selectedUser.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.selectedUser.id);
        this.filteredUsers = [...this.users];
        this.closeDeleteUserModal();
        console.log('Utilisateur supprimé');
      },
      error: (error) => {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      }
    });
  }

  openAddUserModal() {
    // Implement add user modal logic if needed
    this.selectedUser = {
      first_name: '',
      last_name: '',
      email: '',
      telephone: '',
      city: '',
      code_postal: '',
      device_type: '',
      role_id: undefined,
      password: '',
      confirmPassword: ''
    };
    this.showEditModal = true;
  }
}