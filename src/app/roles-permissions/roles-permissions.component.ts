import { Component, OnInit } from '@angular/core';
import { RoleService } from '../services/role.service';
import { MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-roles-permissions',
  templateUrl: './roles-permissions.component.html',
  styleUrl: './roles-permissions.component.css'
})
export class RolesPermissionsComponent implements OnInit {
  roles: any[] = [];
  pagedRoles: any[] = [];
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  totalPagesArray: number[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  selectedRole: any = null;
  editName: string = '';
  editActive: boolean = true;
  editLevel: number = 1;
  editUserCount: number = 0;
  addName: string = '';
  addLevel: number = 1;
  addUserCount: number = 0;
  addActive: boolean = true;

  constructor(
    private rolesService: RoleService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.fetchRoles();
  }

  fetchRoles(): void {
    this.rolesService.getAll().subscribe((data: any[]) => {
      // Sort roles by created_at in descending order (most recent first)
      this.roles = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      console.log('Roles fetched:', this.roles);
      this.applyFilters();
    });
  }

  applyFilters(): void {
    let filtered = this.roles;
    // Status filter
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(role => role.active);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(role => !role.active);
    }
    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(role =>
        (role.name && role.name.toLowerCase().includes(term)) ||
        (role.slug && role.slug.toLowerCase().includes(term))
      );
    }
    this.totalPages = Math.ceil(filtered.length / this.pageSize) || 1;
    this.totalPagesArray = Array(this.totalPages).fill(0).map((x, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedRoles = filtered.slice(start, start + this.pageSize);
  }

  onPageSizeChange(event: any): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFilters();
  }

  onEditRole(role: any): void {
    this.selectedRole = { ...role };
    this.editName = this.selectedRole.name;
    this.editActive = !!this.selectedRole.active;
    this.editLevel = this.selectedRole.level;
    this.editUserCount = this.selectedRole.user_count ?? 0;
  }

  updateRole(): void {
    if (!this.selectedRole) return;
    this.selectedRole.name = this.editName;
    this.selectedRole.active = this.editActive ? 1 : 0;
    this.selectedRole.level = this.editLevel;
    this.selectedRole.user_count = this.editUserCount;
    this.rolesService.update(this.selectedRole.id, {
      name: this.selectedRole.name,
      level: this.selectedRole.level,
      active: this.selectedRole.active,
      user_count: this.selectedRole.user_count
    }).subscribe({
      next: () => {
        this.fetchRoles();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Le rôle a été modifié avec succès.'
        });
        const modal = document.getElementById('edit-role');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la modification du rôle.'
        });
      }
    });
  }

  onRestoreRole(role: any): void {
    this.selectedRole = { ...role };
  }

  onDeleteRole(role: any): void {
    this.selectedRole = { ...role };
  }

  removeRole(role: any): void {
    console.log('Removing role:', role);
    this.rolesService.delete(role.id).subscribe({
      next: () => {
        this.fetchRoles();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Le rôle a été supprimé avec succès.'
        });
        const modal = document.getElementById('delete_modal');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la suppression du rôle.'
        });
        this.messageService.add({
          severity: 'warn',
          summary: 'Attention',
          detail: 'Veuillez vérifier la connexion ou réessayer.'
        });
      }
    });
  }

  restoreRole(role: any): void {
    this.rolesService.restore(role.id).subscribe({
      next: () => {
        this.fetchRoles();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Le rôle a été restauré avec succès.'
        });
        const modal = document.getElementById('restore_modal');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la restauration du rôle.'
        });
      }
    });
  }

  addRole(): void {
    if (!this.addName) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Le nom du rôle est obligatoire.'
      });
      return;
    }
    if (this.addLevel === null || this.addLevel === undefined) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Le niveau du rôle est obligatoire.'
      });
      return;
    }
    if (this.addUserCount === null || this.addUserCount === undefined) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: "Le nombre d'utilisateurs est obligatoire."
      });
      return;
    }
    if (this.addActive === null || this.addActive === undefined) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: "Le statut actif/inactif est obligatoire."
      });
      return;
    }
    const newRole = {
      name: this.addName,
      level: this.addLevel,
      user_count: this.addUserCount,
      active: this.addActive ? 1 : 0
    };
    this.rolesService.create(newRole).subscribe({
      next: () => {
        this.fetchRoles();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Le rôle a été ajouté avec succès.'
        });
        this.addName = '';
        this.addLevel = 1;
        this.addUserCount = 0;
        this.addActive = true;
        const modal = document.getElementById('add-role');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de l\'ajout du rôle.'
        });
      }
    });
  }

  exportExcel(): void {
    try {
      const data = this.pagedRoles.map(role => ({
        'Nom': role.name,
        'Slug': role.slug,
        'Niveau': role.level,
        'Nombre d\'utilisateurs': role.user_count,
        'Statut': role.active ? 'Actif' : 'Inactif',
        'Créé le': role.created_at
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rôles');
      XLSX.writeFile(workbook, 'roles.xlsx');
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Exportation Excel effectuée avec succès.'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors de l\'exportation Excel.'
      });
    }
  }

  exportPdf(): void {
    try {
      const doc = new jsPDF();
      const columns = ['Nom', 'Slug', 'Niveau', 'Nombre d\'utilisateurs', 'Statut', 'Créé le'];
      const rows = this.pagedRoles.map(role => [
        role.name,
        role.slug,
        role.level,
        role.user_count,
        role.active ? 'Actif' : 'Inactif',
        role.created_at
      ]);
      autoTable(doc, {
        head: [columns],
        body: rows,
        styles: { fontSize: 9 }
      });
      doc.save('roles.pdf');
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Exportation PDF effectuée avec succès.'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors de l\'exportation PDF.'
      });
    }
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
}