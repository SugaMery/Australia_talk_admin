import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MediaService } from '../services/media.service';

@Component({
  selector: 'app-medias',
  templateUrl: './medias.component.html',
  styleUrl: './medias.component.css'
})
export class MediasComponent implements OnInit {
  medias: any[] = [];
  selectedMedia: any = null;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(private mediaService: MediaService) {}
  ngOnInit(): void {
    this.reloadMedias();
  }

  searchText: string = '';
  filterStatus: boolean | null = null; // true: actif, false: inactif, null: tous
  sortType: 'recent' | 'asc' | 'desc' = 'recent';
  pageSize: number = 10;
  currentPage: number = 1;

  get sortLabel() {
    switch (this.sortType) {
      case 'recent': return 'Récemment ajouté';
      case 'asc': return 'Ascendant';
      case 'desc': return 'Descendant';
      default: return '';
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAndSortedMedias().length / this.pageSize);
  }

  pagedMedias(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAndSortedMedias().slice(start, start + this.pageSize);
  }

  filteredAndSortedMedias() {
    let result = this.medias;

    // Filtrage par statut
    if (this.filterStatus === true) {
      result = result.filter(m => !m.deleted_at);
    } else if (this.filterStatus === false) {
      result = result.filter(m => m.deleted_at);
    }

    // Recherche par nom de fichier
    if (this.searchText) {
      const txt = this.searchText.toLowerCase();
      result = result.filter(m => (m.filename || '').toLowerCase().includes(txt));
    }

    // Tri
    if (this.sortType === 'asc') {
      result = result.slice().sort((a, b) => a.filename.localeCompare(b.filename));
    } else if (this.sortType === 'desc') {
      result = result.slice().sort((a, b) => b.filename.localeCompare(a.filename));
    } else if (this.sortType === 'recent') {
      result = result.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }

  setSort(type: 'recent' | 'asc' | 'desc') {
    this.sortType = type;
  }

  reloadMedias() {
    this.mediaService.getAll().subscribe({
      next: (data) => {
        this.medias = data;
        this.currentPage = 1; // reset page on reload
      },
      error: (err) => {
        console.error('Erreur lors du chargement des médias:', err);
      }
    });
  }

  deleteMedia() {
    if (!this.selectedMedia) return;
    this.selectedMedia.deleted_at = new Date().toISOString();
    this.mediaService.delete(this.selectedMedia.id).subscribe({
      next: () => {
        console.log('Média supprimé avec succès');
      },
      error: (err) => {
        console.error('Erreur lors de la suppression du média:', err);
      }
    });
    this.selectedMedia = null;
  }

  onADDIconFileChange(event: any) {
    const file = event.target.files && event.target.files[0];
    this.selectedFile = file ? file : null;
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = e => this.previewUrl = reader.result;
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.previewUrl = null;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) {
        this.selectedFile = null;
        this.selectedFile = null;
        console.log('Invalid file type or size exceeds 2MB');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
       // this.selectedFile = e.target?.result ?? null;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFile = null;
      this.selectedFile = null;
    }
  }

  @ViewChild('addBlogModal') addBlogModal?: ElementRef;

  addMedia() {
    if (!this.selectedFile) return;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.mediaService.upload(formData).subscribe({
      next: (media) => {
        this.medias.unshift(media);
        this.selectedFile = null;
        this.previewUrl = null;
        // Fermer le modal après ajout
        const modal: any = document.getElementById('add_blog');
        if (modal) {
          // Bootstrap 5 modal hide
          (window as any).bootstrap?.Modal.getOrCreateInstance(modal).hide();
        }
      },
      error: (err) => {
        console.error('Erreur lors de l\'upload du média:', err);
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }
}

