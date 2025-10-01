import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { TagService } from '../services/tag.service';
import $ from 'jquery';

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
  styleUrls: ['./add-article.component.scss']
})
export class AddArticleComponent implements OnInit {
  // Track article types by ID for better performance in ngFor
  trackById(index: number, type: ArticleType): number {
    return type.id;
  }

  // Form properties
  accessType: string = '';
  articleTitle: string = '';
  articleTags: any[] = []; // Now stores tag IDs (number[])
  categories: any[] = []; // Categories loaded from service
  availableTags: any[] = []; // Tags loaded from service
  selectedCategory: any = null;
  isFree: boolean = false;
  isGratuite: boolean = false;
  text: string = '';
getTagNameById(tagId: any): string {
  const tag = this.availableTags?.find((t: any) => t.id === tagId);
  return tag ? tag.name : tagId;
}
getSelectedItemsPureWithIds(): { id: number | string, name: string }[] {
  const selectedItems: { id: number | string, name: string }[] = [];
  const elements = document.querySelectorAll<HTMLLIElement>('.select2-selection__choice');

  elements.forEach(el => {
    const name = el.getAttribute('title') || el.textContent?.trim() || '';
    // Find the tag object by name
    const tag = this.availableTags.find((t: any) => t.name === name);
    if (tag) {
      selectedItems.push( tag.id);
    } else if (name) {
      selectedItems.push({ id: name, name });
    }
  });

  return selectedItems;
}

// Get list of articleTags IDs with corresponding tag names
getArticleTagsWithNames(): { id: number, name: string }[] {
  return this.articleTags.map(tagId => {
    const tag = this.availableTags.find((t: any) => t.id === tagId);
    return {
      id: tagId,
      name: tag ? tag.name : String(tagId)
    };
  });
}


getSelectedItems(): string[] {
  const selectedItems: string[] = [];

  // Récupère tous les éléments <li> contenant les choix
  $('.select2-selection__choice').each(function () {
    // Dans Select2, le texte affiché est souvent dans title ou dans le span interne
    const text = $(this).attr('title') || $(this).text().trim();
    if (text) {
      selectedItems.push(text);
    }
  });

  return selectedItems;
}


checkTags() {
  console.log('Tags via jQuery:', this.getSelectedItems());
  console.log('Tags via TS pur:', this.getSelectedItemsPureWithIds());
}


  // Media properties
  mediaPreviews: { url: string; type: 'image' | 'video' }[] = [];
  selectedMedia: File[] = [];
  selectedMediaToView: { url: string; type: 'image' | 'video' } | null = null;

  // Article types for checkboxes
  articleTypes: ArticleType[] = [
    { id: 1, type: 'Mise à jour logicielle', description: 'Guides pour installer les dernières mises à jour sur Android et iOS', urgent: true, model: false },
    { id: 2, type: 'Dépannage', description: 'Solutions pour les problèmes courants après une mise à jour', urgent: true, model: false },
    { id: 4, type: 'Sécurité', description: 'Conseils pour sécuriser votre téléphone après une mise à jour', urgent: true, model: false },
    { id: 7, type: 'Sauvegarde et restauration', description: 'Comment sauvegarder et restaurer les données', urgent: true, model: false },
    { id: 9, type: 'Connectivité', description: 'Résolution des problèmes de Wi-Fi, Bluetooth et données mobiles', urgent: true, model: false },
    { id: 13, type: 'Stockage', description: 'Comment gérer et libérer de l’espace de stockage', urgent: true, model: false },
    { id: 20, type: 'Mises à jour de sécurité', description: 'Importance des patchs de sécurité et comment les appliquer', urgent: true, model: false }
  ];

  constructor(
    private categoryService: CategoryService,
    private tagsService: TagService
  ) {}

  ngOnInit(): void {
    // Load categories from service
    this.categoryService.getAll().subscribe((categories: any[]) => {
      this.categories = categories;
      console.log('Categories loaded:', this.categories);
    });

    // Load tags from service
    this.tagsService.getAll().subscribe((tags: any[]) => {
      this.availableTags = tags;
      console.log('Tags loaded:', this.availableTags);
    });

    // Log first phrase on page for debugging
    setTimeout(() => {
      const firstPhrase = document.body.innerText.trim().split('\n')[0];
      console.log('First phrase in page:', firstPhrase);
    }, 0);

    // Load Quill CSS
    const quillLink = document.createElement('link');
    quillLink.rel = 'stylesheet';
    quillLink.href = 'assets/plugins/quill/quill.snow.css';
    document.head.appendChild(quillLink);

    // Load Quill JS
    const quillScript = document.createElement('script');
    quillScript.src = 'assets/plugins/quill/quill.min.js';
    document.body.appendChild(quillScript);

    // Remove Select2 initialization and handlers
  }

  // Handle checkbox changes for article types
  onCheckboxChange(type: ArticleType) {
    console.log(`${type.type} checkbox changed to: ${type.model}`);
  }

  // View media in modal
  viewMedia(media: { url: string; type: 'image' | 'video' }) {
    this.selectedMediaToView = media;
    const modal = document.getElementById('add-product-category');
    if (modal) {
      const bsModal = new (window as any).bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  // Remove media from previews and selected files
  removeMedia(index: number): void {
    this.mediaPreviews.splice(index, 1);
    this.selectedMedia.splice(index, 1);
  }

  // Handle media file selection
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

  // Remove a tag from selected tags (by index)
  removeTag(index: number): void {
    this.articleTags.splice(index, 1);
  }

  // Log selected tags (IDs)
  onTagsChange() {
    console.log('Selected tag IDs:', this.articleTags);
  }

  // Get selected category from Select2
getSelectedCategoryFromSelect2(): { id: number | string, name: string } | null {
  const rendered = document.querySelector('.select2-selection__rendered[id^="select2-category"]');
  if (rendered) {
    const name = rendered.getAttribute('title') || rendered.textContent?.trim() || '';
    // Find the category object by name
    const cat = this.categories.find((c: any) => c.name === name);
    if (cat) {
      return { id: cat.id, name: cat.name };
    } else if (name) {
      return { id: name, name };
    }
  }
  return null;
}

// Check selected category
checkCategory() {
  console.log('Catégorie via Select2:', this.getSelectedCategoryFromSelect2());
}

  // Submit article form
  addArticle() {
    const selectedTypes = this.articleTypes.filter(t => t.model).map(t => t.type);
    if (selectedTypes.length === this.articleTypes.length) {
      selectedTypes.push('update', 'tutorial');
    }

    this.checkTags();
    this.checkCategory();

    const selectedTags = this.articleTags;
    // Utilise la catégorie récupérée via Select2
    const selectedCategoryObj = this.getSelectedCategoryFromSelect2();
    const selectedCategory = selectedCategoryObj ? selectedCategoryObj.id : (this.selectedCategory && this.selectedCategory.id ? this.selectedCategory.id : this.selectedCategory);

    const allMediaFiles = this.selectedMedia.length > 0 ? this.selectedMedia : [];

    const articlePayload = {
      title: this.articleTitle,
      content: this.text,
      types: selectedTypes,
      tags: selectedTags,
      category: selectedCategory,
      medias: allMediaFiles
    };

    console.log('Article à créer :', articlePayload);
    console.log('Tags sélectionnés :', selectedTags);
    console.log('Catégorie sélectionnée :', selectedCategory);
    console.log('Fichiers média sélectionnés :', allMediaFiles);
  }
}