import { Component, OnInit } from '@angular/core';
import { ArticleService } from '../services/article.service';
import { MediaService } from '../services/media.service';
import { environment } from '../environments/environment';
import { finalize } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MessageService } from 'primeng/api';

export interface Article {
  id: number;
  title: string;
  categories?: { name?: string; type?: string }[];
  type?: string;
  isfree?: number | boolean;
  status?: string;
  tags?: any[];
  views_count?: number;
  likes_count?: number;
   media?: any[];
  author_id?: string | number | null;
  active?: boolean; // Ajouté pour correspondre à l'utilisation dans le code
  // ...autres propriétés selon vos besoins...
}

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
  articles: Article[] = [];
  pagedArticles: any[] = [];
  filteredArticles: any[] = [];

  allCategories: string[] = [];
  allTags: string[] = [];
  selectedCategoryFilter: string = '';
  selectedTagFilter: string = '';

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
    this.articleService.getAllWithRelated().subscribe({
      next: (arts) => {
        this.articles = arts;
        console.log('Fetched articles:', this.articles);
        this.extractCategoriesAndTags();
        this.applyFilters();
        this.updatePagination();
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors du chargement des articles'});
      }
    });
  }

  extractCategoriesAndTags() {
    const categoriesSet = new Set<string>();
    const tagsSet = new Set<string>();
    for (const article of this.articles) {
      if (article.categories && article.categories.length > 0) {
        for (const cat of article.categories) {
          if (cat.name) categoriesSet.add(cat.name);
        }
      }
      if (article.tags && article.tags.length > 0) {
        for (const tag of article.tags) {
          if (tag.name) tagsSet.add(tag.name);
        }
      }
    }
    this.allCategories = Array.from(categoriesSet);
    this.allTags = Array.from(tagsSet);
  }

  applyFilters() {
    let filtered = this.articles;
    if (this.selectedCategoryFilter) {
      filtered = filtered.filter(a =>
        a.categories && a.categories.some((c: any) => c.name === this.selectedCategoryFilter)
      );
    }
    if (this.selectedTagFilter) {
      filtered = filtered.filter(a =>
        a.tags && a.tags.some((t: any) => t.name === this.selectedTagFilter)
      );
    }
    if (this.searchTerm && this.searchTerm.trim().length > 0) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(a =>
        (a.title || '').toLowerCase().includes(term)
      );
    }
    this.filteredArticles = filtered;
    this.updatePagination();
  }

  updatePagination() {
    const total = this.filteredArticles?.length || 0;
    this.totalPages = Math.ceil(total / this.pageSize) || 1;
    this.totalPagesArray = Array(this.totalPages).fill(0).map((x, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedArticles = this.filteredArticles.slice(start, end);
  }

  onPageSizeChange(event: any) {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
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

  refreshArticles() {
    // Recharge la liste des articles depuis l'API ou le service
    this.fetchArticles();
  }

  exportExcel() {
    const data = this.filteredArticles.map(article => ({
      'Titre': article.title,
      'Catégorie': article.categories && article.categories.length > 0 ? (article.categories[0].name || article.categories[0].type) : article.type,
      'Est gratuit': article.isfree ? 'Oui' : 'Non',
      'Statut': article.status === 'published' ? 'Publié' : (article.status === 'pending' ? 'En attente' : article.status),
      'Tags': article.tags && article.tags.length > 0 ? article.tags.map((t: { name: any; }) => t.name).join(', ') : '-',
      'Nombre de vues': article.views_count ?? 0,
      'Nombre de likes': article.likes_count ?? 0,
      'Créé par': article.author ? `${article.author.first_name} ${article.author.last_name}` : 'N/A',
      'Contenu': article.content ?? '',
      'Image': article.media && article.media.length > 0 ? article.media[0].path : ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Articles');
    XLSX.writeFile(workbook, 'articles.xlsx');
  }

  exportPdf() {
    const doc = new jsPDF();
    const columns = ['Titre', 'Catégorie', 'Est gratuit', 'Statut', 'Tags', 'Nombre de vues', 'Nombre de likes', 'Créé par'];
    const rows = this.filteredArticles.map(article => [
      article.title,
      article.categories && article.categories.length > 0 ? (article.categories[0].name || article.categories[0].type) : article.type,
      article.isfree ? 'Oui' : 'Non',
      article.status === 'published' ? 'Publié' : (article.status === 'pending' ? 'En attente' : article.status),
      article.tags && article.tags.length > 0 ? article.tags.map((t: { name: any; }) => t.name).join(', ') : '-',
      article.views_count ?? 0,
      article.likes_count ?? 0,
      article.author ? `${article.author.first_name} ${article.author.last_name}` : 'N/A'
    ]);
    autoTable(doc, {
      head: [columns],
      body: rows,
      styles: { fontSize: 9 }
    });
    doc.save('articles.pdf');
  }
}
