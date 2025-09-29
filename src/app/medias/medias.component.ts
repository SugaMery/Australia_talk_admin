import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MediaService, Media } from '../services/media.service';
import { jsPDF } from 'jspdf';
import { MessageService } from 'primeng/api'; // Add this import

@Component({
  selector: 'app-medias',
  templateUrl: './medias.component.html',
  styleUrl: './medias.component.css',
  providers: [MessageService] // Add provider if not global
})
export class MediasComponent implements OnInit {
  medias: any[] = [];
  selectedMedia: any = null;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(private mediaService: MediaService, private messageService: MessageService) {}
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
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors du chargement des médias'});
      }
    });
  }

  deleteMedia() {
    if (!this.selectedMedia) return;
    this.selectedMedia.deleted_at = new Date().toISOString();
    this.mediaService.delete(this.selectedMedia.id).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Succès', detail:'Média supprimé avec succès'});
        this.reloadMedias();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression du média:', err);
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de la suppression du média'});
      }
    });
    this.selectedMedia = null;
  }

  onADDIconFileChange(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
      if (!allowedTypes.includes(file.type)) {
        this.selectedFile = null;
        this.previewUrl = null;
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Seuls les fichiers JPG, PNG et MP4 sont autorisés'});
        return;
      }
      // Only restrict image size, allow any video size
      if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) {
        this.selectedFile = null;
        this.previewUrl = null;
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Image max 2MB'});
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = e => this.previewUrl = reader.result;
      // Use DataURL for both image and video preview
      reader.readAsDataURL(this.selectedFile!);
    } else {
      this.selectedFile = null;
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
    // Only append if selectedFile is not null
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.mediaService.upload(formData).subscribe({
      next: (media) => {
        this.medias.unshift(media);
        this.selectedFile = null;
        this.previewUrl = null;
        this.messageService.add({severity:'success', summary:'Succès', detail:'Média ajouté avec succès'});
        // Fermer le modal après ajout
        const modal: any = document.getElementById('add_blog');
        if (modal) {
          (window as any).bootstrap?.Modal.getOrCreateInstance(modal).hide();
        }
      },
      error: (err) => {
        console.error('Erreur lors de l\'upload du média:', err);
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de l\'upload du média'});
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  exportPDF() {
		const doc = new jsPDF();
		let y = 10;
		doc.setFontSize(16);
		doc.text('Liste des médias', 10, y);
		y += 10;
		doc.setFontSize(12);

		this.pagedMedias().forEach((media, idx) => {
			doc.text(`Nom: ${media.filename}`, 10, y);
			y += 7;
			doc.text(`Taille: ${media.size} octets`, 10, y);
			y += 7;
			doc.text(`Date ajout: ${this.formatDate(media.created_at)}`, 10, y);
			y += 7;
			doc.text(`Statut: ${media.deleted_at ? 'Inactif' : 'Actif'}`, 10, y);
			y += 10;
			// Saut de page si nécessaire
			if (y > 270 && idx < this.pagedMedias().length - 1) {
				doc.addPage();
				y = 10;
			}
		});

		doc.save('medias.pdf');
	}

  openMediaInNewTab(event: Event, media: any): void {
  event.preventDefault();
  const url = media.path && media.path.startsWith('http')
    ? media.path
    : 'http://localhost:5000/uploads/' + media.filename;
  window.open(url, '_blank');
}

	formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleString('fr-FR');
	}

	restoreMedia(media: Media): void {
    if (!media.id) return;
    this.mediaService.restore(media.id).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Succès', detail:'Média restauré avec succès'});
        this.reloadMedias();
      },
      error: err => {
        this.messageService.add({severity:'error', summary:'Erreur', detail: err.message});
      }
    });
  }
}

