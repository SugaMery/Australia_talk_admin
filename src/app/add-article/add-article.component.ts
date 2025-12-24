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

export interface ArticleTranslation {
  language_id: number;
  language_code: string;
  title: string;
  content: string;
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

  // Multi-language properties
  currentLanguageId: number = 1; // 1 = French, 2 = English, 3 = Spanish
  languages: { id: number; code: string; name: string }[] = [
    { id: 1, code: 'fr', name: 'Français' },
    { id: 2, code: 'en', name: 'English' },
    { id: 3, code: 'es', name: 'Español' }
  ];
  translations: ArticleTranslation[] = [
    { language_id: 1, language_code: 'fr', title: '', content: '' },
    { language_id: 2, language_code: 'en', title: '', content: '' },
    { language_id: 3, language_code: 'es', title: '', content: '' }
  ];

  // Media properties
  mediaPreviews: { url: string; type: 'image' | 'video' }[] = [];
  selectedMedia: File[] = [];
  selectedMediaToView: { url: string; type: 'image' | 'video' } | null = null;

  // Article types for checkboxes
  articleTypes: ArticleType[] = [

    // Ajouts demandés — types d'articles supplémentaires
    { id: 21, type: 'Actualités', description: 'Annonces et nouvelles importantes du secteur', urgent: true, model: false },
    { id: 22, type: 'Tutoriels', description: 'Guides pas à pas pour réaliser des tâches et configurations', urgent: false, model: false },
    { id: 23, type: 'Annonces', description: 'Communiqués officiels et déclarations produits', urgent: true, model: false },
    { id: 24, type: 'Critiques', description: 'Avis et tests détaillés de produits et services', urgent: false, model: false },
    { id: 25, type: 'Comparatifs', description: 'Comparaison entre appareils, versions ou solutions', urgent: false, model: false },
    { id: 26, type: 'Articles', description: 'Contenu éditorial général et analyses', urgent: false, model: false }
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
    // Load categories and tags for current language
    this.loadCategoriesAndTags();
    // Initialize display for the current language
    this.updateCurrentLanguageDisplay();
  }

  /**
   * Load categories and tags for the current language
   */
  loadCategoriesAndTags(): void {
    // Load categories from service with current language
    this.categoryService.getAll(this.currentLanguageId).subscribe((categories: any[]) => {
      this.categories = categories;
      console.log('Categories loaded for language', this.currentLanguageId, ':', this.categories);
    });

    // Load all tags for dropdown with current language
    this.tagsService.getAll(this.currentLanguageId).subscribe((tags: any[]) => {
      this.availableTags = Array.isArray(tags) ? tags : [];
      console.log('Tags loaded for language', this.currentLanguageId, ':', this.availableTags);
    });
  }

  /**
   * Handle language tab click - save then switch
   */
  onLanguageTabClick(languageId: number): void {
    if (this.currentLanguageId === languageId) {
      return; // Same language, no action needed
    }

    // Step 1: Save current language translation
    this.saveCurrentLanguageTranslation();

    // Step 2: Switch to new language
    this.currentLanguageId = languageId;

    // Step 3: Display new language content
    this.updateCurrentLanguageDisplay();

    console.log('Switched to language:', languageId, 'Translations:', this.translations);
  }

  /**
   * Update the displayed title and content for the current language
   */
  updateCurrentLanguageDisplay(): void {
    const currentTrans = this.translations.find(t => t.language_id === this.currentLanguageId);
    if (currentTrans) {
      this.articleTitle = currentTrans.title || '';
      this.text = currentTrans.content || '';
      console.log('Updated display for language', this.currentLanguageId, '- Title:', this.articleTitle, 'Content length:', this.text.length);
    } else {
      console.warn('No translation found for language', this.currentLanguageId);
    }
  }

  /**
   * Save current language translations before switching
   */
  saveCurrentLanguageTranslation(): void {
    const currentTrans = this.translations.find(t => t.language_id === this.currentLanguageId);
    if (currentTrans) {
      currentTrans.title = this.articleTitle || '';
      currentTrans.content = this.text || '';
      console.log('Saved translation for language', this.currentLanguageId, '- Title:', currentTrans.title, 'Content length:', currentTrans.content.length);
    } else {
      console.warn('Translation object not found for language', this.currentLanguageId);
    }
  }

  /**
   * Get the language name by ID
   */
  getLanguageName(languageId: number): string {
    const lang = this.languages.find(l => l.id === languageId);
    return lang ? lang.name : 'Unknown';
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
    // Update translation for current language
    this.onTitleChange(this.articleTitle);
  }

  // Update title for current language immediately when input changes
  onTitleChange(value: string) {
    this.articleTitle = value || '';
    const currentTrans = this.translations.find(t => t.language_id === this.currentLanguageId);
    if (currentTrans) {
      currentTrans.title = this.articleTitle;
    }
  }

  // Update content for current language immediately when textarea changes
  onContentChange(value: string) {
    this.text = value || '';
    const currentTrans = this.translations.find(t => t.language_id === this.currentLanguageId);
    if (currentTrans) {
      currentTrans.content = this.text;
    }
  }

  /**
   * Translate text using the server proxy. Implements client-side retries.
   */
  async translateText(text: string, source: string, target: string): Promise<string> {
    if (!text || !text.trim()) return '';

    const payload = {
      q: text,
      source: source,
      target: target,
      format: 'text'
    };

    const maxAttempts = 3;
    let lastErr: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const resp: any = await this.http.post('/api/translate', payload).toPromise();

        if (!resp) {
          lastErr = new Error('Empty response from translation proxy');
          throw lastErr;
        }

        if (resp.error) {
          lastErr = new Error(`Proxy error: ${resp.error} ${resp.details || ''}`);
          throw lastErr;
        }

        // Accept several key names depending on backend
        const translated = resp.translatedText || resp.translated_text || resp.translated || (resp.data && resp.data.translatedText);
        if (!translated) {
          // If the API returns another structure (LibreTranslate sometimes returns { translatedText }) we already covered it
          lastErr = new Error('Translation returned empty');
          throw lastErr;
        }

        return translated;
      } catch (err) {
        lastErr = err;
        console.warn(`translateText attempt ${attempt} failed:`, err);
        // small backoff
        await new Promise(r => setTimeout(r, 300 * attempt));
      }
    }

    // After retries, rethrow the last error so callers can handle
    throw lastErr || new Error('Translation failed');
  }

  /**
   * Translate current language title and content into the other languages and save them in `translations`.
   */
  async translateCurrentToOthers(): Promise<void> {
    // Ensure current edits are saved
    this.saveCurrentLanguageTranslation();
    const currentTrans = this.translations.find(t => t.language_id === this.currentLanguageId);
    if (!currentTrans) return;

    const sourceCode = currentTrans.language_code || this.languages.find(l => l.id === this.currentLanguageId)?.code || 'fr';

    const translatePromises: Promise<void>[] = [];
    const errors: string[] = [];
    
    for (const trans of this.translations) {
      if (trans.language_id === this.currentLanguageId) continue; // skip source
      const targetCode = trans.language_code || this.languages.find(l => l.id === trans.language_id)?.code;
      if (!targetCode) continue;

      const p = (async () => {
        try {
          const translatedTitle = await this.translateText(currentTrans.title || '', sourceCode, targetCode);
          const translatedContent = await this.translateText(currentTrans.content || '', sourceCode, targetCode);
          trans.title = translatedTitle || trans.title;
          trans.content = translatedContent || trans.content;
        } catch (e) {
          const errorMsg = `${sourceCode}->${targetCode}`;
          console.error(`Erreur traduction ${errorMsg}:`, e);
          errors.push(errorMsg);
        }
      })();

      translatePromises.push(p);
    }

    await Promise.all(translatePromises);

    if (errors.length > 0) {
      this.messageService.add({ severity: 'warn', summary: 'Traduction partielle', detail: `Erreurs pour: ${errors.join(', ')}`, sticky: false });
      console.warn(`Translation completed with errors for: ${errors.join(', ')}`);
    }

    // If current view is not source, keep display consistent
    this.updateCurrentLanguageDisplay();
  }

  // UI handler to trigger translation and notify user
  async autoTranslateFromCurrent(): Promise<void> {
    try {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Traduction en cours...' });
      await this.translateCurrentToOthers();
      this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Traductions mises à jour.' });
    } catch (err) {
      const errorDetail = err instanceof Error ? err.message : 'Erreur inconnue';
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Erreur', 
        detail: `Erreur lors de la traduction automatique: ${errorDetail}`,
        sticky: true
      });
      console.error('autoTranslateFromCurrent error:', err);
    }
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
    // Save current language translation before validation
    this.saveCurrentLanguageTranslation();

    console.log('All translations before submit:', this.translations);
    console.log('Selected Tags (articleTags):', this.articleTags);

    // Validation: all fields required for all languages
    const validationError = this.validateAllLanguages();
    if (validationError) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: validationError });
      return;
    }

    if (!this.selectedCategory) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'La catégorie est obligatoire.' });
      return;
    }
    if (!this.articleTags || this.articleTags.length === 0) {
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
      // 1. Create article with all translations (using French first)
      let articleId: number | null = null;

      for (const trans of this.translations) {
        const articlePayload = {
          title: trans.title,
          content: trans.content,
          isfree: this.accessType == 'gratuit' ? 1 : 0,
          type: this.articleTypes.filter(t => t.model).map(t => t.type).join(','),
          language_id: trans.language_id
        };

        console.log('Creating article with language', trans.language_id, ':', articlePayload);
        const articleResp = await this.articleService.create(articlePayload).toPromise();
        if (articleResp && articleResp.id) {
          if (!articleId) {
            articleId = articleResp.id; // Store ID from first language
          }
        }
      }

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
        category_id: this.selectedCategory
      }).toPromise();

      // 4. Link article to tags
      await Promise.all(
        this.articleTags.map(tagId =>
          this.articleTagService.create({
            article_id: articleId,
            tag_id: Number(tagId)
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

  /**
   * Validate that all required fields are filled for all languages
   */
  validateAllLanguages(): string | null {
    for (const trans of this.translations) {
      if (!trans.title.trim()) {
        return `Le titre est obligatoire en ${this.getLanguageName(trans.language_id)}.`;
      }
      if (!trans.content.trim()) {
        return `La description est obligatoire en ${this.getLanguageName(trans.language_id)}.`;
      }
    }
    return null;
  }

  annulerArticle() {
    // Redirection vers la liste des articles
    window.location.href = '/articles';
  }


}