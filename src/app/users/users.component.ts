import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';
import { MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  telephone: string;
  city: string;
  code_postal: string;
  device_type: string;
  role_id: number;
  password: string;
}

export interface EditUser {
  email: string;
  password: string;
  confirmPassword: string;
  last_name: string;
  first_name: string;
  role_id: number;
  telephone: string;
  city: string;
  code_postal: string;
  device_type: string;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  providers: [MessageService]
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
  showReactivateModal: boolean = false;
  selectedUser: any = {};
  selectedDate: any;
  editUser: EditUser = {
    email: '',
    password: '',
    confirmPassword: '',
    last_name: '',
    first_name: '',
    role_id: 0,
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

  statusFilter: string | null = null;
  roleFilter: number | null = null;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.getAllUsers();
    this.getRoles();
    this.filterUsers();
  }

  getAllUsers() {
    this.userService.getAll().subscribe({
      next: (users: any[]) => {
        this.users = users;
        this.filterUsers();
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
    let filtered = this.users;

    if (this.statusFilter === 'active') {
      filtered = filtered.filter(u => !u.deleted_at);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(u => !!u.deleted_at);
    }

    if (this.roleFilter) {
      filtered = filtered.filter(u => u.role_id === this.roleFilter);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        (u.full_name && u.full_name.toLowerCase().includes(term)) ||
        (u.first_name && u.first_name.toLowerCase().includes(term)) ||
        (u.last_name && u.last_name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.telephone && u.telephone.toLowerCase().includes(term))
      );
    }

    this.filteredUsers = filtered;
  }

  filterCities(event: any) {
    const query = event.query.toLowerCase();
    this.filteredCities = this.cities.filter(city =>
      city.nom.toLowerCase().includes(query)
    );
  }

  onCitySelected(event: any) {
    const selectedCity = event.value;
    if (selectedCity && selectedCity.nom && selectedCity.code_postal) {
      this.selectedUser.city = selectedCity.nom;
      this.selectedUser.code_postal = selectedCity.code_postal;
    } else {
      this.selectedUser.city = '';
      this.selectedUser.code_postal = '';
    }
  }

  onCityChange() {
    const selectedCity = this.cities.find(city => city.nom === this.selectedUser.city);
    if (selectedCity) {
      this.selectedUser.code_postal = selectedCity.code_postal;
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
      telephone: user.telephone || '',
      city: user.city || '',
      code_postal: user.code_postal || '',
      device_type: user.device_type || '',
      role_id: user.role_id || 0,
      password: '',
      confirmPassword: ''
    };
    this.showEditModal = true;
  }

  closeEditUserModal() {
    this.showEditModal = false;
    this.selectedUser = {};
  }

  saveUserChanges() {
    // Validate required fields
    const requiredFields = [
      { field: 'first_name', value: this.selectedUser.first_name, label: 'Prénom' },
      { field: 'last_name', value: this.selectedUser.last_name, label: 'Nom' },
      { field: 'email', value: this.selectedUser.email, label: 'Email' },
      { field: 'telephone', value: this.selectedUser.telephone, label: 'Téléphone' },
      { field: 'city', value: this.selectedUser.city, label: 'Ville' },
      { field: 'code_postal', value: this.selectedUser.code_postal, label: 'Code postal' },
      { field: 'device_type', value: this.selectedUser.device_type, label: 'Type d\'appareil' },
      { field: 'role_id', value: this.selectedUser.role_id, label: 'Rôle' }
    ];

    for (const field of requiredFields) {
      if (!field.value || (typeof field.value === 'string' && field.value.trim() === '') || (field.field === 'role_id' && field.value === 0)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: `Le champ ${field.label} est requis.`
        });
        return;
      }
    }

    // Validate password and confirmPassword
    if (!this.selectedUser.password || !this.selectedUser.confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Le mot de passe et la confirmation du mot de passe sont requis.'
      });
      return;
    }

    if (this.selectedUser.password !== this.selectedUser.confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Les mots de passe ne correspondent pas.'
      });
      return;
    }

    const isBreached = this.checkPasswordBreach(this.selectedUser.password);
    if (isBreached) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Ce mot de passe a été compromis. Veuillez en choisir un autre.'
      });
      return;
    }

    const userPayload: RegisterRequest = {
      first_name: this.selectedUser.first_name,
      last_name: this.selectedUser.last_name,
      email: this.selectedUser.email,
      telephone: this.selectedUser.telephone,
      city: this.selectedUser.city,
      code_postal: this.selectedUser.code_postal,
      device_type: this.selectedUser.device_type,
      role_id: this.selectedUser.role_id,
      password: this.selectedUser.password    
    };

    console.log('User payload for create/update:', userPayload);

    if (this.selectedUser.id) {
      this.userService.update(this.selectedUser.id, userPayload).subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            this.users[index] = { ...this.users[index], ...updatedUser };
          }
          this.filterUsers();
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Utilisateur mis à jour avec succès'
          });
          const modal = document.getElementById('edit-customer');
          if (modal && (window as any).bootstrap) {
            const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
            bsModal.hide();
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la mise à jour de l\'utilisateur'
          });
          console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        }
      });
    } else {
      this.userService.create(userPayload).subscribe({
        next: (newUser) => {
          const roleObj = this.roles.find(r => r.id === newUser.role_id);
          const userWithMeta = {
            ...newUser,
            created_at: new Date().toISOString(),
            role_name: roleObj ? roleObj.name : ''
          };
          this.users.push(userWithMeta);
          this.filterUsers();
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Utilisateur ajouté avec succès'
          });
          const modal = document.getElementById('edit-customer');
          if (modal && (window as any).bootstrap) {
            const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
            bsModal.hide();
          }
        },
        error: (error) => {
          const detail = error?.error?.message || error?.message || 'Erreur lors de l\'ajout de l\'utilisateur';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail
          });
          console.error('Erreur lors de l\'ajout de l\'utilisateur:', error, userPayload);
        }
      });
    }
  }

  private checkPasswordBreach(password: string): boolean {
    return false;
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
        const index = this.users.findIndex(u => u.id === this.selectedUser.id);
        if (index !== -1) {
          this.users[index] = {
            ...this.users[index],
            deleted_at: new Date().toISOString()
          };
          this.filteredUsers = [...this.users];
        }
           const modal = document.getElementById('delete-modal');
          if (modal && (window as any).bootstrap) {
            const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
            bsModal.hide();
          }
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Utilisateur supprimé avec succès'
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la suppression de l\'utilisateur'
        });
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      }
    });
  }

  openAddUserModal() {
    this.selectedUser = {
      first_name: '',
      last_name: '',
      email: '',
      telephone: '',
      city: '',
      code_postal: '',
      device_type: '',
      role_id: 0,
      password: '',
      confirmPassword: '',
    };
    this.showEditModal = true;
  }

  openReactivateUserModal(user: any) {
    this.selectedUser = { ...user };
    this.showReactivateModal = true;
  }

  closeReactivateUserModal() {
    this.showReactivateModal = false;
    this.selectedUser = {};
  }

  reactivateUser() {
    this.userService.restore(this.selectedUser.id).subscribe({
      next: () => {
        const index = this.users.findIndex(u => u.id === this.selectedUser.id);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], deleted_at: null };
          this.filteredUsers = [...this.users];
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Utilisateur réactivé avec succès'
        });
          const modal = document.getElementById('reactivate-modal');
          if (modal && (window as any).bootstrap) {
            const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
            bsModal.hide();
          }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la réactivation de l\'utilisateur'
        });
        console.error('Erreur lors de la réactivation de l\'utilisateur:', error);
      }
    });
  }

  // Add exportExcel method
  exportExcel() {
    const data = this.filteredUsers.map(user => ({
      'Prénom': user.first_name,
      'Nom': user.last_name,
      'Email': user.email,
      'Téléphone': user.telephone,
      'Ville': user.city,
      'Code postal': user.code_postal,
      'Type d\'appareil': user.device_type,
      'Rôle': user.role_name || user.role_id,
      'Statut': user.deleted_at ? 'Inactive' : 'Active',
      'Créé le': user.created_at
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Utilisateurs');
    XLSX.writeFile(workbook, 'utilisateurs.xlsx');
  }

  // Add exportPdf method
  exportPdf() {
    const doc = new jsPDF();
    const columns = [
      'Prénom', 'Nom', 'Email', 'Téléphone',  'Rôle', 'Statut'
    ];
    const rows = this.filteredUsers.map(user => [
      user.first_name,
      user.last_name,
      user.email,
      user.telephone,
      user.role_name || user.role_id,
      user.deleted_at ? 'Inactive' : 'Active'
    ]);
    autoTable(doc, {
      head: [columns],
      body: rows,
      styles: { fontSize: 9 }
    });
    doc.save('utilisateurs.pdf');
  }

  // Add fetchUsers method
  fetchUsers() {
    this.getAllUsers();
    this.messageService.add({
      severity: 'info',
      summary: 'Rafraîchir',
      detail: 'Liste des utilisateurs rafraîchie'
    });
  }
}