import { Component, OnInit } from '@angular/core';
import { LogUserService } from '../services/log-user.service';
import { MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-log-users',
  templateUrl: './log-users.component.html',
  styleUrl: './log-users.component.css'
})
export class LogUsersComponent implements OnInit {
  logUsers: any[] = [];
  pagedLogUsers: any[] = [];
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  totalPagesArray: number[] = [];
  searchTerm: string = '';
  orderBy: 'desc' | 'asc' = 'desc'; // default to 'Plus récent'
  statusFilter: string = 'all';
  selectedLogUser: any = null;
  editName: string = '';
  editActive: boolean = true;
  editLevel: number = 1;
  editUserCount: number = 0;
  addName: string = '';
  addLevel: number = 1;
  addUserCount: number = 0;
  addActive: boolean = true;

  constructor(
    private logUserService: LogUserService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.fetchLogUsers();
  }

  fetchLogUsers(): void {
    this.logUserService.getAll().subscribe((data: any[]) => {
      // Sort log users by created_at in descending order (most recent first)
      this.logUsers = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      console.log('Log users fetched:', this.logUsers);
      this.applyFilters();
    });
  }

  applyFilters(): void {
    // Filter by full_name (case-insensitive, partial match)
    let filtered = this.logUsers.filter(logUser =>
      (!this.searchTerm || (logUser.full_name || '').toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
    // Status filter
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(user => user.active);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(user => !user.active);
    }
    // After filtering, sort by created_at
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return this.orderBy === 'desc' ? dateB - dateA : dateA - dateB;
    });
    this.totalPages = Math.ceil(filtered.length / this.pageSize) || 1;
    this.totalPagesArray = Array(this.totalPages).fill(0).map((x, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedLogUsers = filtered.slice(start, start + this.pageSize);
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

  onEditLogUser(user: any): void {
    this.selectedLogUser = { ...user };
    this.editName = this.selectedLogUser.name;
    this.editActive = !!this.selectedLogUser.active;
    this.editLevel = this.selectedLogUser.level;
    this.editUserCount = this.selectedLogUser.user_count ?? 0;
  }

  updateLogUser(): void {
    if (!this.selectedLogUser) return;
    this.selectedLogUser.name = this.editName;
    this.selectedLogUser.active = this.editActive ? 1 : 0;
    this.selectedLogUser.level = this.editLevel;
    this.selectedLogUser.user_count = this.editUserCount;
    this.logUserService.update(this.selectedLogUser.id, {
      user_id: this.selectedLogUser.user_id,
      type: this.selectedLogUser.type,
      ip_address: this.selectedLogUser.ip_address,
      user_agent: this.selectedLogUser.user_agent
    }).subscribe({
      next: () => {
        this.fetchLogUsers();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'L\'utilisateur du log a été modifié avec succès.'
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
          detail: 'Erreur lors de la modification de l\'utilisateur du log.'
        });
      }
    });
  }

  onRestoreLogUser(user: any): void {
    this.selectedLogUser = { ...user };
  }

  onDeleteLogUser(user: any): void {
    this.selectedLogUser = { ...user };
  }

  removeLogUser(user: any): void {
    console.log('Removing log user:', user);
    this.logUserService.delete(user.id).subscribe({
      next: () => {
        this.fetchLogUsers();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'L\'utilisateur du log a été supprimé avec succès.'
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
          detail: 'Erreur lors de la suppression de l\'utilisateur du log.'
        });
        this.messageService.add({
          severity: 'warn',
          summary: 'Attention',
          detail: 'Veuillez vérifier la connexion ou réessayer.'
        });
      }
    });
  }

  restoreLogUser(user: any): void {
/*     this.logUserService.restore(user.id).subscribe({
      next: () => {
        this.fetchLogUsers();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'L\'utilisateur du log a été restauré avec succès.'
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
          detail: 'Erreur lors de la restauration de l\'utilisateur du log.'
        });
      }
    }); */
  }

  addLogUser(): void {
    if (!this.addName) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Le nom de l\'utilisateur du log est obligatoire.'
      });
      return;
    }
    if (this.addLevel === null || this.addLevel === undefined) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Le niveau de l\'utilisateur du log est obligatoire.'
      });
      return;
    }
    if (this.addUserCount === null || this.addUserCount === undefined) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: "Le nombre d'utilisateurs du log est obligatoire."
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
    const newLogUser = {
      name: this.addName,
      level: this.addLevel,
      user_count: this.addUserCount,
      active: this.addActive ? 1 : 0
    };
/*     this.logUserService.create(newLogUser).subscribe({
      next: () => {
        this.fetchLogUsers();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'L\'utilisateur du log a été ajouté avec succès.'
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
          detail: 'Erreur lors de l\'ajout de l\'utilisateur du log.'
        });
      }
    }); */
  }

  exportExcel(): void {
    try {
      const data = this.pagedLogUsers.map(user => ({
        'ID': user.id,
        'User ID': user.user_id,
        'Nom complet': user.full_name,
        'Type': user.type,
        'IP': user.ip_address,
        'User Agent': user.user_agent,
        'API Path': user.api_path,
        'Date': user.created_at
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'JournauxUtilisateurs');
      XLSX.writeFile(workbook, 'journaux-utilisateur.xlsx');
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Exportation Excel des journaux utilisateur effectuée avec succès.'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors de l\'exportation Excel des journaux utilisateur.'
      });
    }
  }

  exportPdf(): void {
    try {
      const doc = new jsPDF();
      const columns = [
        'ID',
        'User ID',
        'Nom complet',
        'Type',
        'IP',
        'User Agent',
        'API Path',
        'Date'
      ];
      const rows = this.pagedLogUsers.map(user => [
        user.id,
        user.user_id,
        user.full_name,
        user.type,
        user.ip_address,
        user.user_agent,
        user.api_path,
        user.created_at
      ]);
      autoTable(doc, {
        head: [columns],
        body: rows,
        styles: { fontSize: 8 }
      });
      doc.save('journaux-utilisateur.pdf');
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Exportation PDF des journaux utilisateur effectuée avec succès.'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors de l\'exportation PDF des journaux utilisateur.'
      });
    }
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
}