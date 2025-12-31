import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { TagService } from '../services/tag.service';
import { MediaArticleService } from '../services/media-article.service';
import { ArticleCategoryService } from '../services/article-category.service';
import { ArticleTagService } from '../services/article-tag.service';
import { ArticleService } from '../services/article.service';
import { ArticleGenerationService } from '../services/article-generation.service';
import { TranslationService } from '../services/translation.service';
import { MediaService } from '../services/media.service';
import $ from 'jquery';
import nlp from 'compromise'; // Import compromise for NLP
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  // Suggested tags from API
  suggestedTags: any[] = [];

  // Suggested categories from API
  suggestedCategories: any[] = [];

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
    private articleGenerationService: ArticleGenerationService,
    private translationService: TranslationService,
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
   * Generate article content using the Article Generation Service
   */
  async generateArticle(): Promise<void> {
    try {
      // Ensure title is saved
      this.saveCurrentLanguageTranslation();
      const currentTrans = this.translations.find(t => t.language_id === this.currentLanguageId);
      
      if (!currentTrans || !currentTrans.title) {
        this.messageService.add({ 
          severity: 'warn', 
          summary: 'Titre requis', 
          detail: 'Veuillez d\'abord saisir un titre pour générer le contenu.'
        });
        return;
      }

      this.messageService.add({ 
        severity: 'info', 
        summary: 'Génération', 
        detail: 'Génération de l\'article en cours... Cela peut prendre quelques secondes.',
        sticky: false
      });

      const response: any = await this.articleGenerationService.generateArticle(currentTrans.title).toPromise();

      console.log('Full API Response:', response);

      if (!response || !response.success) {
        throw new Error(response?.error || 'Échec de la génération');
      }

      // Try multiple possible field names for the content
      const generatedContent = response.content || 
                              response.generated_content || 
                              response.article || 
                              response.body || 
                              response.text ||
                              (response.data && response.data.content);

      if (generatedContent && generatedContent.trim()) {
        this.text = generatedContent;
        currentTrans.content = generatedContent;
        
        // Extract and auto-select suggested tags
        if (response.suggestedTags && Array.isArray(response.suggestedTags)) {
          this.suggestedTags = response.suggestedTags;
          console.log('Suggested tags from API:', this.suggestedTags);
          
          // Auto-select suggested tags
          const suggestedTagIds = response.suggestedTags.map((tag: any) => tag.id);
          this.articleTags = [...new Set([...this.articleTags, ...suggestedTagIds])];
          console.log('Auto-selected tags:', this.articleTags);
        }

        // Extract and auto-select suggested categories
        if (response.suggestedCategories && Array.isArray(response.suggestedCategories) && response.suggestedCategories.length > 0) {
          this.suggestedCategories = response.suggestedCategories;
          console.log('Suggested categories from API:', this.suggestedCategories);
          
          // Auto-select the first suggested category if none is selected
          if (!this.selectedCategory && response.suggestedCategories[0]) {
            const suggestedCategoryId = response.suggestedCategories[0].id;
            this.selectedCategory = suggestedCategoryId;
            console.log('Auto-selected category:', suggestedCategoryId, response.suggestedCategories[0]);
          }
        }
        
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Succès', 
          detail: 'Article généré avec succès. Tags et catégories suggérés sélectionnés automatiquement.',
          sticky: false
        });
      } else {
        console.warn('No content found in API response:', response);
        throw new Error(`Contenu vide retourné par l'API. Réponse reçue: ${JSON.stringify(response)}`);
      }
    } catch (err) {
      const errorDetail = err instanceof Error ? err.message : 'Erreur inconnue';
      
      let userMessage = errorDetail;
      if (errorDetail.includes('Token d\'authentification')) {
        userMessage = 'Vous devez être connecté pour générer un article.';
      } else if (errorDetail.includes('Titre requis')) {
        userMessage = 'Veuillez d\'abord saisir un titre.';
      }
      
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Erreur de génération', 
        detail: userMessage,
        sticky: true
      });
      
      console.error('generateArticle error:', err);
    }
  }

  /**
   * Translate text using the Translation Service
   */
  async translateText(text: string, source: string, target: string): Promise<string> {
    console.log(`Translating text from ${source} to ${target}:`, text);
    try {
      const containsHtml = /<[^>]+>/i.test(text || '');
      const textToTranslate = String(text || '');

      if (containsHtml && typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(textToTranslate, 'text/html');

        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
          acceptNode(node: Node) {
            if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
            return /\S/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        } as any);

        const textNodes: Node[] = [];
        const parts: string[] = [];
        let nd = walker.nextNode();
        while (nd) {
          textNodes.push(nd);
          parts.push(nd.nodeValue || '');
          nd = walker.nextNode();
        }

        if (parts.length === 0) return '';

        const DELIM = '\uE000\uE001__SEP__';
        const joined = parts.join(DELIM);

        const translatedJoined = await this.translationService.translateWithRetry(joined, target, source, 3);
        if (!translatedJoined) return '';

        const translatedParts = translatedJoined.split(DELIM);
        if (translatedParts.length === parts.length) {
          for (let i = 0; i < textNodes.length; i++) {
            textNodes[i].nodeValue = translatedParts[i];
          }
          return doc.body.innerHTML;
        }

        const paragraphs = translatedJoined
          .split(/\n{2,}/)
          .map(p => p.trim())
          .filter(p => p.length > 0)
          .map(p => `<p>${p}</p>`)
          .join('\n');
        return paragraphs || translatedJoined;
      }

      return await this.translationService.translateWithRetry(textToTranslate, target, source, 3);
    } catch (err) {
      console.error('translateText helper error:', err);
      return this.translationService.translateWithRetry(text, target, source, 3);
    }
  }

  /**
   * Translate current language title and content into the other languages and save them in `translations`.
   */
  async translateCurrentToOthers(): Promise<void> {
    // Ensure current edits are saved
    this.saveCurrentLanguageTranslation();
    const currentTrans = this.translations.find(t => t.language_id === this.currentLanguageId);
    if (!currentTrans) {
      throw new Error('Current translation not found');
    }

    const sourceCode = currentTrans.language_code || this.languages.find(l => l.id === this.currentLanguageId)?.code || 'fr';

    // Check if there's content to translate
    if (!currentTrans.title && !currentTrans.content) {
      throw new Error('No content to translate. Please enter title or content first.');
    }

    const translatePromises: Promise<void>[] = [];
    const errors: string[] = [];
    let successCount = 0;
    
    for (const trans of this.translations) {
      if (trans.language_id === this.currentLanguageId) continue; // skip source
      const targetCode = trans.language_code || this.languages.find(l => l.id === trans.language_id)?.code;
      if (!targetCode) continue;

      const p = (async () => {
        try {
          // Only translate if source has content
          if (currentTrans.title) {
            const translatedTitle = await this.translateText(currentTrans.title, sourceCode, targetCode);
            trans.title = translatedTitle;
            console.log(`Successfully translated title to ${targetCode}:`, translatedTitle);
          }
          if (currentTrans.content) {
            const translatedContent = await this.translateText(currentTrans.content, sourceCode, targetCode);
            trans.content = translatedContent;
            console.log(`Successfully translated content to ${targetCode}, length:`, translatedContent.length);
          }
          successCount++;
        } catch (e) {
          const errorMsg = `${sourceCode.toUpperCase()}->${targetCode.toUpperCase()}`;
          const details = e instanceof Error ? e.message : String(e);
          console.error(`Erreur traduction ${errorMsg}:`, details);
          errors.push(`${errorMsg}: ${details}`);
        }
      })();

      translatePromises.push(p);
    }

    await Promise.all(translatePromises);

    // Report results
    if (errors.length > 0 && successCount === 0) {
      // All translations failed
      throw new Error(`Translation failed: ${errors.join('; ')}`);
    } else if (errors.length > 0) {
      // Partial success
      console.warn(`Translation completed with partial errors:`, errors);
    }

    // If current view is not source, keep display consistent
    this.updateCurrentLanguageDisplay();
  }

  // UI handler to trigger translation and notify user
  async autoTranslateFromCurrent(): Promise<void> {
    try {
      this.messageService.add({ 
        severity: 'info', 
        summary: 'Traduction', 
        detail: 'Traduction en cours... Cela peut prendre quelques secondes.',
        sticky: false
      });

      await this.translateCurrentToOthers();

      this.messageService.add({ 
        severity: 'success', 
        summary: 'Succès', 
        detail: 'Traductions mises à jour avec succès.',
        sticky: false
      });
    } catch (err) {
      const errorDetail = err instanceof Error ? err.message : 'Erreur inconnue';
      
      let userMessage = errorDetail;
      if (errorDetail.includes('translation_service_unavailable')) {
        userMessage = 'Les services de traduction sont actuellement indisponibles. Veuillez réessayer dans quelques instants.';
      } else if (errorDetail.includes('No content to translate')) {
        userMessage = 'Veuillez d\'abord saisir un titre ou du contenu à traduire.';
      } else if (errorDetail.includes('503')) {
        userMessage = 'Les services de traduction sont surchargés. Veuillez réessayer plus tard.';
      }
      
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Erreur de traduction', 
        detail: userMessage,
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
      // 1. Create article with PRIMARY language (French - language_id = 1)
      const primaryTrans = this.translations.find(t => t.language_id === 1);
      if (!primaryTrans) {
        throw new Error('French translation not found');
      }

      const articlePayload = {
        title: primaryTrans.title,
        content: primaryTrans.content,
        isfree: this.accessType == 'gratuit' ? 1 : 0,
        type: this.articleTypes.filter(t => t.model).map(t => t.type).join(','),
        language_id: 1  // Always create with French first
      };

      console.log('Creating article with language 1 (French):', articlePayload);
      const articleResp = await this.articleService.create(articlePayload).toPromise();
      
      if (!articleResp || !articleResp.id) {
        throw new Error('Article ID not returned from API');
      }

      const articleId = articleResp.id;
      console.log('Article created successfully with ID:', articleId);

      // 2. Save translations for other languages (English and Spanish)
      const translationErrors: string[] = [];
      for (const trans of this.translations) {
        if (trans.language_id === 1) continue; // Skip French as it's already the main article

        try {
          console.log(`Saving translation for language ${trans.language_id}:`, trans);
          await this.articleService.saveTranslation(
            articleId,
            trans.language_id,
            trans.title,
            trans.content
          ).toPromise();
          console.log(`Translation saved successfully for language ${trans.language_id}`);
        } catch (error) {
          const errorMsg = `Failed to save translation for language ${trans.language_id}`;
          console.error(errorMsg, error);
          translationErrors.push(errorMsg);
        }
      }

      // 3. Upload medias using MediaService.upload and link to article
      let mediaIds: number[] = [];
      const uploadedMediaResults = await Promise.all(
        this.selectedMedia.map(file => {
          const formData = new FormData();
          formData.append('file', file);
          return this.mediaService.upload(formData).toPromise();
        })
      );
      
      console.log('Uploaded media results:', uploadedMediaResults);
      
      mediaIds = uploadedMediaResults
        .map(res => {
          console.log('Processing media response:', res);
          return res && (res.id || (res as any).media_id);
        })
        .filter((id): id is number => typeof id === 'number');
      
      console.log('Extracted media IDs:', mediaIds);
      
      if (mediaIds.length === 0) {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors du téléversement des médias.' });
        throw new Error('Aucun média téléversé');
      }
      
      // Link media to article
      console.log('Linking media to article. Article ID:', articleId, 'Media IDs:', mediaIds);
      
      for (const mediaId of mediaIds) {
        try {
          console.log('Linking media:', { media_id: mediaId, article_id: articleId });
          await this.mediaArticleService.create({ media_id: mediaId, article_id: articleId }).toPromise();
          console.log('Successfully linked media ID', mediaId, 'to article ID', articleId);
        } catch (error) {
          console.error('Error linking media ID', mediaId, ':', error);
          throw error;
        }
      }

      // 4. Link article to category
      await this.articleCategoryService.create({
        article_id: articleId,
        category_id: this.selectedCategory
      }).toPromise();

      // 5. Link article to tags
      await Promise.all(
        this.articleTags.map(tagId =>
          this.articleTagService.create({
            article_id: articleId,
            tag_id: Number(tagId)
          }).toPromise()
        )
      );

      // Final success message
      let successMessage = 'Article ajouté avec succès !';
      if (translationErrors.length > 0) {
        successMessage += ` (${translationErrors.length} traductions non sauvegardées)`;
        console.warn('Translation save warnings:', translationErrors);
      }
      
      this.messageService.add({ severity: 'success', summary: 'Succès', detail: successMessage });
      // setTimeout(() => window.location.href = '/articles', 1200);
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

  /**
   * Debug method to check translation state
   */
  debugTranslations() {
    console.log('=== TRANSLATIONS DEBUG ===');
    console.log('Current Language ID:', this.currentLanguageId);
    console.log('All Translations:');
    this.translations.forEach((t, idx) => {
      console.log(`  [${idx}] Language ${t.language_id} (${t.language_code}):`, {
        title: t.title.substring(0, 50) + (t.title.length > 50 ? '...' : ''),
        contentLength: t.content.length
      });
    });
  }

  /**
   * Show translations for a specific language in a toast message (short preview)
   */
  showLanguageTranslations(languageId: number): void {
    const trans = this.translations.find(t => t.language_id === languageId);
    if (!trans) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `Traduction pour la langue ${languageId} non trouvée.` });
      return;
    }

    const titlePreview = trans.title && trans.title.length > 0 ? trans.title : '(vide)';
    const contentPreview = trans.content ? (trans.content.length > 300 ? trans.content.slice(0, 300) + '...' : trans.content) : '(vide)';

    this.messageService.add({
      severity: 'info',
      summary: `Traduction ${this.getLanguageName(languageId)}`,
      detail: `${titlePreview}\n\n${contentPreview}`,
      sticky: false
    });

    console.log(`Translation preview for language ${languageId}:`, trans);
  }

  /**
   * Force reset Spanish translation to ensure it's properly saved
   * This can be used if Spanish translation got corrupted with English content
   */
  async forceRetranslateSpanish(): Promise<void> {
    try {
      const frenchTrans = this.translations.find(t => t.language_id === 1);
      const spanishTrans = this.translations.find(t => t.language_id === 3);
      
      if (!frenchTrans) {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Erreur', 
          detail: 'Traduction française non trouvée.'
        });
        return;
      }

      if (!frenchTrans.title || !frenchTrans.content) {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Erreur', 
          detail: 'Veuillez d\'abord remplir le titre et le contenu en français.'
        });
        return;
      }

      this.messageService.add({ 
        severity: 'info', 
        summary: 'Traduction', 
        detail: 'Traduction en espagnol en cours... Cela peut prendre quelques secondes.',
        sticky: false
      });

      if (spanishTrans) {
        // Re-translate French title and content to Spanish
        spanishTrans.title = await this.translateText(frenchTrans.title, 'fr', 'es');
        spanishTrans.content = await this.translateText(frenchTrans.content, 'fr', 'es');
        
        console.log('Spanish translation updated:', spanishTrans);

        this.messageService.add({ 
          severity: 'success', 
          summary: 'Succès', 
          detail: 'Traduction espagnole mise à jour avec succès.'
        });

        // Switch to Spanish to verify
        this.currentLanguageId = 3;
        this.updateCurrentLanguageDisplay();
      }
    } catch (err) {
      const errorDetail = err instanceof Error ? err.message : 'Erreur inconnue';
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Erreur', 
        detail: `Erreur lors de la traduction: ${errorDetail}`
      });
      console.error('forceRetranslateSpanish error:', err);
    }
  }

  annulerArticle() {
    // Redirection vers la liste des articles
    window.location.href = '/articles';
  }


}