import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { MediaService } from '../services/media.service';
import { environment } from '../environments/environment';
import { finalize } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'], // <-- FIX: should be styleUrls (array), not styleUrl
  providers: [MessageService]
})
export class CategoryComponent implements OnInit {
  name: string = '';
  slug: string = '';
  iconFile: File | null = null;
  parent_id?: number;
  type: 'Free' | 'Paid' = 'Free';
  active: boolean = true;
  cart_order?: number;
  model: string = '';
  loading: boolean = false;
  iconPreview: string | ArrayBuffer | null = null; // New property for preview
  categories: any[] = [];
  pagedCategories: any[] = [];
  filteredCategories: any[] = [];

  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  totalPagesArray: number[] = [];

  // Add missing properties for edit modal
  selectedCategory: any = null;
  selectedEditIconFile: File | null = null;
  selectedEditIconPreview: string | ArrayBuffer | null = null;
  previousEditIconId: number | null = null;
  categoryToDelete: any = null;

  // Fix: ensure searchTerm and statusFilter are initialized and used with ngModel in template
  private _searchTerm: string = '';
  private _statusFilter: string = 'all';

  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(val: string) {
    this._searchTerm = val;
    this.applyFilters();
  }

  get statusFilter(): string {
    return this._statusFilter;
  }
  set statusFilter(val: string) {
    this._statusFilter = val;
    this.applyFilters();
  }

  constructor(
    private categoryService: CategoryService,
    private mediaService: MediaService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.fetchCategories();
  }

  fetchCategories() {
    this.categoryService.getAll().subscribe({
      next: (cats) => {
        this.categories = cats;
        this.applyFilters();
      },
      error: (err) => {
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors du chargement des catégories'});
      }
    });
  }

  applyFilters() {
    this.filteredCategories = this.categories.filter(cat => {
      const matchesSearch = !this._searchTerm || cat.name?.toLowerCase().includes(this._searchTerm.toLowerCase());
      const matchesStatus =
        this._statusFilter === 'all' ||
        (this._statusFilter === 'active' && cat.active) ||
        (this._statusFilter === 'inactive' && !cat.active);
      return matchesSearch && matchesStatus;
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  onPageSizeChange(event: any) {
    this.pageSize = +event.target.value || this.pageSize;
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  updatePagination() {
    const totalItems = this.filteredCategories.length;
    this.totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));
    this.totalPagesArray = Array(this.totalPages).fill(0).map((_, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedCategories = this.filteredCategories.slice(start, end);
  }

  onIconFileChange(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) {
        this.iconFile = null;
        this.iconPreview = null;
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Type de fichier invalide ou taille > 2Mo'});
        return;
      }
      this.iconFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.iconPreview = e.target?.result ?? null;
      };
      reader.readAsDataURL(file);
    } else {
      this.iconFile = null;
      this.iconPreview = null;
    }
  }

  getImageUrl(cat: any): string {
    if (!cat.path) return 'assets/default-category.png';
    const filename = cat.filename || cat.path.split('\\').pop();
    return `${environment.apiUrl}/uploads/${filename}`;
  }

  onImageError(event: any) {
    event.target.src = 'assets/default-category.png';
  }

  async addCategory() {
    this.loading = true;
    let icon_id: number | undefined = undefined;

    if (this.iconFile) {
      try {
        const formData = new FormData();
        formData.append('file', this.iconFile);
        const mediaResp: any = await this.mediaService.upload(formData).toPromise();
        icon_id = mediaResp.id;
      } catch (err) {
        this.loading = false;
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Échec de l\'upload de l\'image'});
        return;
      }
    }

    const payload: any = {
      name: this.name,
      type: this.type,
      parent_id: this.parent_id,
      active: !!this.active,
      icon_id: icon_id
    };

    this.categoryService.create(payload).subscribe({
      next: (category) => {
        this.loading = false;
        this.resetForm();
        this.fetchCategories();
        this.messageService.add({severity:'success', summary:'Succès', detail:'Catégorie ajoutée avec succès'});
        // Close modal (Bootstrap 5)
        const modal = document.getElementById('add-category');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de l\'ajout de la catégorie'});
      }
    });
  }

  private resetForm() {
    this.name = '';
    this.slug = '';
    this.iconFile = null;
    this.iconPreview = null;
    this.parent_id = undefined;
    this.type = 'Free';
    this.active = true;
    this.cart_order = undefined;
    this.model = '';
  }

  getStatusText(cat: any): string {
    return cat.active ? 'Active' : 'Inactive';
  }

  onEditCategory(cat: any) {
    this.selectedCategory = { ...cat };
    this.selectedEditIconFile = null;
    this.selectedEditIconPreview = null;
    this.previousEditIconId = cat.icon_id || null;
    if (cat.path) {
      const filename = cat.filename || cat.path.split('\\').pop();
      this.selectedEditIconPreview = `${environment.apiUrl}/uploads/${filename}`;
    } else {
      this.selectedEditIconPreview = 'assets/default-category.png';
    }
  }

  onEditIconFileChange(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) {
        this.selectedEditIconFile = null;
        this.selectedEditIconPreview = null;
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Type de fichier invalide ou taille > 2Mo'});
        return;
      }
      this.selectedEditIconFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedEditIconPreview = e.target?.result ?? null;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedEditIconFile = null;
      this.selectedEditIconPreview = null;
    }
  }

  async updateCategory() {
    if (!this.selectedCategory) return;
    let icon_id = this.selectedCategory.icon_id;

    if (this.selectedEditIconFile) {
      try {
        const formData = new FormData();
        formData.append('file', this.selectedEditIconFile);
        const mediaResp: any = await this.mediaService.upload(formData).toPromise();
        icon_id = mediaResp.id;

        if (this.previousEditIconId && this.previousEditIconId !== icon_id) {
          this.mediaService.delete(this.previousEditIconId).subscribe({
            next: () => {},
            error: () => {
              this.messageService.add({severity:'warn', summary:'Avertissement', detail:'Suppression de l\'ancienne image échouée'});
            }
          });
        }
      } catch (err) {
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Échec de l\'upload de l\'image'});
        return;
      }
    }

    const payload: any = {
      ...this.selectedCategory,
      icon_id: icon_id,
      active: !!this.selectedCategory.active
    };

    this.categoryService.update(this.selectedCategory.id, payload).subscribe({
      next: () => {
        this.fetchCategories();
        this.messageService.add({severity:'success', summary:'Succès', detail:'Catégorie mise à jour avec succès'});
        // Close modal (Bootstrap 5)
        const modal = document.getElementById('edit-category');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
        this.selectedCategory = null;
        this.selectedEditIconFile = null;
        this.selectedEditIconPreview = null;
        this.previousEditIconId = null;
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de la mise à jour de la catégorie'});
      }
    });
  }

  onDeleteCategory(cat: any) {
    this.categoryToDelete = cat;
  }

  confirmDeleteCategory() {
    if (!this.categoryToDelete) return;
    this.categoryService.delete(this.categoryToDelete.id).subscribe({
      next: () => {
        this.categories = this.categories.filter((c: any) => c.id !== this.categoryToDelete.id);
        this.messageService.add({severity:'success', summary:'Succès', detail:'Catégorie supprimée avec succès'});
        // Close modal (Bootstrap 5)
        const modal = document.getElementById('delete-modal');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
        this.categoryToDelete = null;
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de la suppression de la catégorie'});
      }
    });
  }

  exportExcel() {
    const data = this.filteredCategories.map(cat => ({
      'Nom': cat.name,
      'Slug': cat.slug,
      'Type': cat.type === 'Free' ? 'Gratuit' : 'Payant',
      'Créé le': cat.created_at,
      'Statut': cat.active ? 'Active' : 'Inactive'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Catégories');
    XLSX.writeFile(workbook, 'categories.xlsx');
  }

  exportPdf() {
    const doc = new jsPDF();
    const columns = ['Nom', 'Slug', 'Type', 'Créé le', 'Statut'];
    const rows = this.filteredCategories.map(cat => [
      cat.name,
      cat.slug,
      cat.type === 'Free' ? 'Gratuit' : 'Payant',
      cat.created_at,
      cat.active ? 'Active' : 'Inactive'
    ]);
    autoTable(doc, {
      head: [columns],
      body: rows,
      styles: { fontSize: 9 }
    });
    doc.save('categories.pdf');
  }
}