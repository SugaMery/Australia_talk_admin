import { Component, OnInit } from '@angular/core';
import { ArticleService } from '../services/article.service';
import { MediaService } from '../services/media.service';
import { environment } from '../environments/environment';
import { finalize } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.css'],
  providers: [MessageService]
})
export class ArticlesComponent implements OnInit {
  title: string = '';
  slug: string = '';
  imageFile: File | null = null;
  author_id?: number;
  type: 'Free' | 'Paid' = 'Free';
  active: boolean = true;
  order?: number;
  content: string = '';
  loading: boolean = false;
  imagePreview: string | ArrayBuffer | null = null;
  articles: any[] = [];
  pagedArticles: any[] = [];
  filteredArticles: any[] = [];

  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  totalPagesArray: number[] = [];

  selectedArticle: any = null;
  selectedEditImageFile: File | null = null;
  selectedEditImagePreview: string | ArrayBuffer | null = null;
  previousEditImageId: number | null = null;
  articleToDelete: any = null;

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
    private articleService: ArticleService,
    private mediaService: MediaService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.fetchArticles();
  }

  fetchArticles() {
    this.articleService.getAll().subscribe({
      next: (arts) => {
        this.articles = arts;
        this.applyFilters();
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors du chargement des articles'});
      }
    });
  }

  applyFilters() {
    this.filteredArticles = this.articles.filter(art => {
      const matchesSearch = !this._searchTerm || art.title?.toLowerCase().includes(this._searchTerm.toLowerCase());
      const matchesStatus =
        this._statusFilter === 'all' ||
        (this._statusFilter === 'active' && art.active) ||
        (this._statusFilter === 'inactive' && !art.active);
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
    const totalItems = this.filteredArticles.length;
    this.totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));
    this.totalPagesArray = Array(this.totalPages).fill(0).map((_, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedArticles = this.filteredArticles.slice(start, end);
  }

  onImageFileChange(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) {
        this.imageFile = null;
        this.imagePreview = null;
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Type de fichier invalide ou taille > 2Mo'});
        return;
      }
      this.imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result ?? null;
      };
      reader.readAsDataURL(file);
    } else {
      this.imageFile = null;
      this.imagePreview = null;
    }
  }

  getImageUrl(art: any): string {
    if (!art.path) return 'assets/default-article.png';
    const filename = art.filename || art.path.split('\\').pop();
    return `${environment.apiUrl}/uploads/${filename}`;
  }

  onImageError(event: any) {
    event.target.src = 'assets/default-article.png';
  }

  async addArticle() {
    this.loading = true;
    let image_id: number | undefined = undefined;

    if (this.imageFile) {
      try {
        const formData = new FormData();
        formData.append('file', this.imageFile);
        const mediaResp: any = await this.mediaService.upload(formData).toPromise();
        image_id = mediaResp.id;
      } catch (err) {
        this.loading = false;
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Échec de l\'upload de l\'image'});
        return;
      }
    }

    const payload: any = {
      title: this.title,
      slug: this.slug,
      type: this.type,
      author_id: this.author_id,
      active: !!this.active,
      image_id: image_id,
      content: this.content
    };

    this.articleService.create(payload).subscribe({
      next: (article) => {
        this.loading = false;
        this.resetForm();
        this.fetchArticles();
        this.messageService.add({severity:'success', summary:'Succès', detail:'Article ajouté avec succès'});
        const modal = document.getElementById('add-article');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
      },
      error: () => {
        this.loading = false;
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de l\'ajout de l\'article'});
      }
    });
  }

  private resetForm() {
    this.title = '';
    this.slug = '';
    this.imageFile = null;
    this.imagePreview = null;
    this.author_id = undefined;
    this.type = 'Free';
    this.active = true;
    this.order = undefined;
    this.content = '';
  }

  getStatusText(art: any): string {
    return art.active ? 'Active' : 'Inactive';
  }

  onEditArticle(art: any) {
    this.selectedArticle = { ...art };
    this.selectedEditImageFile = null;
    this.selectedEditImagePreview = null;
    this.previousEditImageId = art.image_id || null;
    if (art.path) {
      const filename = art.filename || art.path.split('\\').pop();
      this.selectedEditImagePreview = `${environment.apiUrl}/uploads/${filename}`;
    } else {
      this.selectedEditImagePreview = 'assets/default-article.png';
    }
  }

  onEditImageFileChange(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) {
        this.selectedEditImageFile = null;
        this.selectedEditImagePreview = null;
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Type de fichier invalide ou taille > 2Mo'});
        return;
      }
      this.selectedEditImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedEditImagePreview = e.target?.result ?? null;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedEditImageFile = null;
      this.selectedEditImagePreview = null;
    }
  }

  async updateArticle() {
    if (!this.selectedArticle) return;
    let image_id = this.selectedArticle.image_id;

    if (this.selectedEditImageFile) {
      try {
        const formData = new FormData();
        formData.append('file', this.selectedEditImageFile);
        const mediaResp: any = await this.mediaService.upload(formData).toPromise();
        image_id = mediaResp.id;

        if (this.previousEditImageId && this.previousEditImageId !== image_id) {
          this.mediaService.delete(this.previousEditImageId).subscribe({
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
      ...this.selectedArticle,
      image_id: image_id,
      active: !!this.selectedArticle.active
    };

    this.articleService.update(this.selectedArticle.id, payload).subscribe({
      next: () => {
        this.fetchArticles();
        this.messageService.add({severity:'success', summary:'Succès', detail:'Article mis à jour avec succès'});
        const modal = document.getElementById('edit-article');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
        this.selectedArticle = null;
        this.selectedEditImageFile = null;
        this.selectedEditImagePreview = null;
        this.previousEditImageId = null;
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de la mise à jour de l\'article'});
      }
    });
  }

  onDeleteArticle(art: any) {
    this.articleToDelete = art;
  }

  confirmDeleteArticle() {
    if (!this.articleToDelete) return;
    this.articleService.delete(this.articleToDelete.id).subscribe({
      next: () => {
        this.articles = this.articles.filter((a: any) => a.id !== this.articleToDelete.id);
        this.messageService.add({severity:'success', summary:'Succès', detail:'Article supprimé avec succès'});
        const modal = document.getElementById('delete-modal');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
        this.articleToDelete = null;
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de la suppression de l\'article'});
      }
    });
  }

  exportExcel() {
    const data = this.filteredArticles.map(art => ({
      'Titre': art.title,
      'Slug': art.slug,
      'Type': art.type === 'Free' ? 'Gratuit' : 'Payant',
      'Auteur': art.author_id,
      'Créé le': art.created_at,
      'Statut': art.active ? 'Active' : 'Inactive'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Articles');
    XLSX.writeFile(workbook, 'articles.xlsx');
  }

  exportPdf() {
    const doc = new jsPDF();
    const columns = ['Titre', 'Slug', 'Type', 'Auteur', 'Créé le', 'Statut'];
    const rows = this.filteredArticles.map(art => [
      art.title,
      art.slug,
      art.type === 'Free' ? 'Gratuit' : 'Payant',
      art.author_id,
      art.created_at,
      art.active ? 'Active' : 'Inactive'
    ]);
    autoTable(doc, {
      head: [columns],
      body: rows,
      styles: { fontSize: 9 }
    });
    doc.save('articles.pdf');
  }
}
 