import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { TagService } from '../services/tag.service';
import { MediaArticleService } from '../services/media-article.service';
import { ArticleCategoryService } from '../services/article-category.service';
import { ArticleTagService } from '../services/article-tag.service';
import { ArticleService } from '../services/article.service';
import { MediaService } from '../services/media.service';
import $ from 'jquery';
import nlp from 'compromise'; // Import compromise for NLP
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

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
  styleUrls: ['./add-article.component.scss'],
  providers: [MessageService]
})
export class AddArticleComponent implements OnInit {
  // Track article types by ID for better performance in ngFor
  trackById(index: number, type: ArticleType): number {
    return type.id;
  }

  // Form properties
  accessType: string =  'gratuit';
  articleTitle: string = '';
  articleTags: any[] = []; // Stores tag IDs (number[])
  categories: any[] = []; // Categories loaded from service
  availableTags: any[] = []; // Tags loaded from service
  selectedCategory: any = null;
  isFree: boolean = false;
  isGratuite: boolean = false;
  text: string = '';

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
    private tagsService: TagService,
    private http: HttpClient,
    private mediaArticleService: MediaArticleService,
    private articleCategoryService: ArticleCategoryService,
    private articleTagService: ArticleTagService,
    private articleService: ArticleService,
    private mediaService: MediaService,
    private messageService: MessageService
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
  }

  // Generate title using compromise NLP
  generateTitleFromContent() {
    if (!this.text || !this.text.trim()) {
      this.articleTitle = '';
      return;
    }

    // Use compromise to analyze the text
    const doc = nlp(this.text);

    // Extract key topics (nouns, verbs, or topics) to form a title
    const topics = doc.topics().out('array'); // Get key terms/topics
    let title = '';

    if (topics.length > 0) {
      // Combine up to 3 key topics for the title
      title = topics.slice(0, 3).join(' ');
    } else {
      // Fallback: Use first sentence or first 8 words
      const trimmed = this.text.trim();
      title = trimmed.split(/[.!?\n]/)[0]; // First sentence
      if (!title || title.length < 3) {
        title = trimmed.split(/\s+/).slice(0, 8).join(' '); // First 8 words
      }
    }

    // Capitalize the title and limit to 60 characters
    title = title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    this.articleTitle = title.length > 60 ? title.slice(0, 60) + '...' : title;
  }

  // Get tag name by ID
  getTagNameById(tagId: any): string {
    const tag = this.availableTags?.find((t: any) => t.id === tagId);
    return tag ? tag.name : tagId;
  }

  // Get selected items with IDs
  getSelectedItemsPureWithIds(): { id: number | string, name: string }[] {
    const selectedItems: { id: number | string, name: string }[] = [];
    const elements = document.querySelectorAll<HTMLLIElement>('.select2-selection__choice');

    elements.forEach(el => {
      const name = el.getAttribute('title') || el.textContent?.trim() || '';
      const tag = this.availableTags.find((t: any) => t.name === name);
      if (tag) {
        selectedItems.push({ id: tag.id, name });
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

  // Get selected items via jQuery
  getSelectedItems(): string[] {
    const selectedItems: string[] = [];
    $('.select2-selection__choice').each(function () {
      const text = $(this).attr('title') || $(this).text().trim();
      if (text) {
        selectedItems.push(text);
      }
    });
    return selectedItems;
  }

  // Check tags
  checkTags() {
    console.log('Tags via jQuery:', this.getSelectedItems());
    console.log('Tags via TS pur:', this.getSelectedItemsPureWithIds());
  }

  // Get selected category from Select2
  getSelectedCategoryFromSelect2(): { id: number | string, name: string } | null {
    const rendered = document.querySelector('.select2-selection__rendered[id^="select2-category"]');
    if (rendered) {
      const name = rendered.getAttribute('title') || rendered.textContent?.trim() || '';
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

  // Submit article form
  async addArticle() {
    // Check and get tags and category from UI
    this.checkTags();
    this.checkCategory();

    const selectedTags = this.getSelectedItemsPureWithIds();
    const selectedCategoryObj = this.getSelectedCategoryFromSelect2();
    const selectedCategory = selectedCategoryObj
      ? selectedCategoryObj.id
      : (this.selectedCategory && this.selectedCategory.id
        ? this.selectedCategory.id
        : this.selectedCategory);

    // Validation: all fields required, at least one image
    if (!this.articleTitle.trim()) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Le titre est obligatoire.' });
      return;
    }
    if (!this.text.trim()) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'La description est obligatoire.' });
      return;
    }
    if (!selectedCategory) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'La catégorie est obligatoire.' });
      return;
    }
    if (!selectedTags || selectedTags.length === 0) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Au moins un tag est obligatoire.' });
      return;
    }
    if (!this.selectedMedia || this.selectedMedia.length === 0) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Au moins une image/vidéo est obligatoire.' });
      return;
    }
    if (!this.articleTypes.some(t => t.model)) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Au moins un type de produit est obligatoire.' });
      return;
    }

    try {
      // 1. Create article (get article ID)
      const articlePayload = {
        title: this.articleTitle,
        content: this.text,
        isfree: this.accessType == 'gratuit' ? 1 : 0,
        type: this.articleTypes.filter(t => t.model).map(t => t.type).join(','),
      };

      const articleResp = await this.articleService.create(articlePayload).toPromise();
      const articleId = articleResp && articleResp.id ? articleResp.id : null;
      if (!articleId) {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la création de l\'article.' });
        throw new Error('Article ID not returned from API');
      }

      // 2. Upload medias using MediaService.upload and link to article
      let mediaIds: number[] = [];
      const uploadedMediaResults = await Promise.all(
        this.selectedMedia.map(file => {
          const formData = new FormData();
          formData.append('file', file);
          return this.mediaService.upload(formData).toPromise();
        })
      );
      mediaIds = uploadedMediaResults
        .map(res => res && res.id)
        .filter((id): id is number => typeof id === 'number');
      if (mediaIds.length === 0) {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors du téléversement des médias.' });
        throw new Error('Aucun média téléversé');
      }
      await Promise.all(
        mediaIds.map(mediaId =>
          this.mediaArticleService.create({ media_id: mediaId, article_id: articleId }).toPromise()
        )
      );

      // 3. Link article to category
      await this.articleCategoryService.create({
        article_id: articleId,
        category_id: selectedCategory
      }).toPromise();

      // 4. Link article to tags
      await Promise.all(
        selectedTags.map(tag =>
          this.articleTagService.create({
            article_id: articleId,
            tag_id: Number(tag.id)
          }).toPromise()
        )
      );

      // Succès final unique
      this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Article ajouté avec succès !' });
      setTimeout(() => window.location.href = '/articles', 1200);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de l\'ajout de l\'article.' });
      console.error('Erreur lors du workflow de création d\'article:', error);
    }
  }

  annulerArticle() {
    // Redirection vers la liste des articles
    window.location.href = '/articles';
  }


}