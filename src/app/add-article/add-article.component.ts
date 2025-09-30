import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { TagService } from '../services/tag.service';

export interface ArticleType {
  id: number;
  type: string;
  description: string;
  urgent: boolean;
  model: boolean;
}

@Component({
  selector: 'app-add-article',
  templateUrl: './add-article.component.html',
  styleUrl: './add-article.component.css'
})
export class AddArticleComponent implements OnInit {
  trackById(index: number, type: ArticleType): number {
    return type.id;
  }

  accessType: string = '';

  articleTitle: string = '';
  //articleType: string = 'Free'; // Add this property
  articleTags: any[] = [];      // Add this property
  categories: any[] = [];
  availableTags: any[] = []; // Now stores tag objects
  selectedTagToAdd: any = null;

  selectedCategory: any = null;
  isFree: boolean = false;
  isGratuite: boolean = false;
  text: string = '';

  selectedMediaFile: File | null = null;
  mediaPreviewUrl: string | null = null;

  imagePreviews: string[] = [];
  selectedImages: File[] = [];

  mediaPreviews: { url: string, type: 'image' | 'video' }[] = [];
  selectedMedia: File[] = [];

  selectedMediaToView: { url: string, type: 'image' | 'video' } | null = null;

  articleTypes: ArticleType[] = [
    { id: 1, type: "Mise à jour logicielle", description: "Guides pour installer les dernières mises à jour sur Android et iOS", urgent: true, model: false },
    { id: 2, type: "Dépannage", description: "Solutions pour les problèmes courants après une mise à jour", urgent: true, model: false },
    { id: 4, type: "Sécurité", description: "Conseils pour sécuriser votre téléphone après une mise à jour", urgent: true, model: false },
    { id: 7, type: "Sauvegarde et restauration", description: "Comment sauvegarder et restaurer les données", urgent: true, model: false },
    { id: 9, type: "Connectivité", description: "Résolution des problèmes de Wi-Fi, Bluetooth et données mobiles", urgent: true, model: false },
    { id: 13, type: "Stockage", description: "Comment gérer et libérer de l'espace de stockage", urgent: true, model: false },
    { id: 20, type: "Mises à jour de sécurité", description: "Importance des patchs de sécurité et comment les appliquer", urgent: true, model: false }
  ];
  onCheckboxChange(type: ArticleType) {
    console.log(`${type.type} checkbox changed to: ${type.model}`);
    // Add logic to handle checkbox changes, e.g., update a form or send data
  }
  constructor(
    private categoryService: CategoryService,
    private tagsService: TagService
  ) { }
viewMedia(media: { url: string, type: 'image' | 'video' }) {
	this.selectedMediaToView = media;
	const modal = document.getElementById('add-product-category');
	if (modal) {
		// Bootstrap 5 modal show
		const bsModal = new (window as any).bootstrap.Modal(modal);
		bsModal.show();
	}
}
  ngOnInit(): void {
    // Log first phrase/text in page
    setTimeout(() => {
      const firstPhrase = document.body.innerText.trim().split('\n')[0];
      console.log('First phrase in page:', firstPhrase);
    }, 0);

    // Load Quill CSS
    const quillLink = document.createElement('link');
    quillLink.rel = 'stylesheet';
    quillLink.href = 'assets/plugins/quill/quill.snow.css';
    document.head.appendChild(quillLink);

    // Load Select2 JS

    // Load Quill JS
    const quillScript = document.createElement('script');
    quillScript.src = 'assets/plugins/quill/quill.min.js';
    document.body.appendChild(quillScript);

    this.categoryService.getAll().subscribe((categories: any[]) => {
      this.categories = categories;
      console.log('Categories loaded:', this.categories);
    });
    this.tagsService.getAll().subscribe((tags: any[]) => {
      this.availableTags = tags;
      console.log('Tags loaded:', this.availableTags);
    });
  }

  selectedArticleTags: any[] = [];

  addTag() {
    if (
      this.selectedTagToAdd &&
      !this.selectedArticleTags.some(tag => tag.id === this.selectedTagToAdd.id)
    ) {
      this.selectedArticleTags = [...this.selectedArticleTags, this.selectedTagToAdd];
      this.selectedTagToAdd = null;
    }
  }

  removeSelectedArticleTag(index: number) {
    this.selectedArticleTags.splice(index, 1);
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedMediaFile = event.target.files[0];
      if (this.mediaPreviewUrl) {
        URL.revokeObjectURL(this.mediaPreviewUrl);
      }
      this.mediaPreviewUrl = URL.createObjectURL(this.selectedMediaFile!);
    }
  }

  onImageSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.selectedImages.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  onMediaSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.selectedMedia.push(file);
        const reader = new FileReader();
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        reader.onload = (e: any) => {
          this.mediaPreviews.push({
            url: e.target.result,
            type: isImage ? 'image' : isVideo ? 'video' : 'image'
          });
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number): void {
    this.imagePreviews.splice(index, 1);
    this.selectedImages.splice(index, 1);
  }

  removeMedia(index: number): void {
    this.mediaPreviews.splice(index, 1);
    this.selectedMedia.splice(index, 1);
  }

  addArticle() {
    // 1. Préparer les données de l'article
    const selectedTypes = this.articleTypes.filter(t => t.model).map(t => t.type);

    // Si tous les types sont sélectionnés, ajouter "update" et "tutorial"
    if (selectedTypes.length === this.articleTypes.length) {
      selectedTypes.push('update', 'tutorial');
    }

    // Préparer les tags (ids ou objets selon besoin)
    const selectedTags = this.availableTags.map(tag => tag.id ? tag.id : tag);

    // Préparer la catégorie (id ou objet selon besoin)
    const selectedCategory = this.selectedCategory && this.selectedCategory.id ? this.selectedCategory.id : this.selectedCategory;

    // Préparer les fichiers média (tous les fichiers sélectionnés)
    const allMediaFiles = this.selectedMedia && this.selectedMedia.length > 0 ? this.selectedMedia : [];

    const articlePayload = {
      title: this.articleTitle,
      content: this.text,
      types: selectedTypes,
      tags: selectedTags,
      category: selectedCategory,
      medias: allMediaFiles
      // ...autres champs nécessaires...
    };

    // Exemple sans backend :
    console.log('Article à créer :', articlePayload);
    console.log('Tags sélectionnés :', selectedTags);
    console.log('Catégorie sélectionnée :', selectedCategory);
    console.log('Fichiers média sélectionnés :', allMediaFiles);

    // Afficher tous les tags disponibles (pour debug ou usage)
    console.log('Tous les tags disponibles :', this.availableTags);
  }
}
