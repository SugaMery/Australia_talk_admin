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
import { ActivatedRoute } from '@angular/router'; // <-- Add this import

export interface ArticleType {
  id: number;
  type: string;
  description: string;
  urgent: boolean;
  model: boolean;
}

@Component({
  selector: 'app-edit-article',
  templateUrl: './edit-article.component.html',
  styleUrl: './edit-article.component.css'
})
export class EditArticleComponent  implements OnInit {
  articleId: number | null = null;
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
  mediaPreviews: { url: string; type: 'image' | 'video'; id?: number }[] = [];
  selectedMedia: File[] = [];
  selectedMediaToView: { url: string; type: 'image' | 'video' , id? : number} | null = null;

  // Nouveaux tableaux pour la logique de mise à jour
  addedMedia: { file: File, previewUrl: string }[] = []; // Fichiers ajoutés à POST avec previewUrl
  removedMedia: any[] = []; // Médias supprimés à ANNULER (id ou url)

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
    private messageService: MessageService,
    private route: ActivatedRoute // <-- Inject ActivatedRoute
  ) {}

  // Fetch article by ID using ArticleService
  getArticleById(id: number): void {
    this.articleService.getRelated(id).subscribe(
      (data: any) => {
        // Fill form fields with fetched data
        const article = data.article;
        this.articleTitle = article.title || '';
        this.text = article.content || '';
        this.accessType = article.isfree === 1 ? 'gratuit' : 'payant';
        
        // Set selected category for PrimeNG dropdown
        if (data.categories && data.categories.length > 0) {
          this.selectedCategory = data.categories[0].id;
        }

        // Set tags for PrimeNG MultiSelect (array of ids)
        if (data.tags && data.tags.length > 0) {
          this.articleTags = data.tags.map((tag: any) => tag.id);
        } else {
          this.articleTags = [];
        }

        // Set media previews (for display)
        if (data.media && data.media.length > 0) {
          this.mediaPreviews = data.media.map((m: any) => ({
            url: m.path,
            id : m.id,
            type: m.extension && m.extension.match(/mp4|webm|ogg/i) ? 'video' : 'image'
          }));
        }

        // Set article types (checkboxes)
        if (article.type) {
          const typesArr = article.type.split(',').map((t: string) => t.trim());
          this.articleTypes.forEach(typeObj => {
            typeObj.model = typesArr.includes(typeObj.type);
          });
        }

        // Optionally, clear selectedMedia (since we only have URLs, not File objects)
        this.selectedMedia = [];
 console.log("Fetching article with ID:", this.selectedCategory),
        // Optionally, log for debug
        console.log('Form populated with article:', {
          articleTitle: this.articleTitle,
          text: this.text,
          accessType: this.accessType,
          selectedCategory: this.selectedCategory,
          articleTags: this.articleTags,
          mediaPreviews: this.mediaPreviews,
          articleTypes: this.articleTypes
        });
      },
      (error: any) => {
        console.error('Error fetching article by ID:', error);
      }
    );
  }

  ngOnInit(): void {
    // Load categories from service
    this.categoryService.getAll().subscribe((categories: any[]) => {
      this.categories = categories;
      // If editing, update Select2 after setting selectedCategory
      setTimeout(() => this.updateSelect2Category(), 0);
    });

    // Load all tags for dropdown, do NOT filter by article or category
    this.tagsService.getAll().subscribe((tags: any[]) => {
      this.availableTags = Array.isArray(tags) ? tags : [];
      // If articleTags already set (from getArticleById), ensure selected tags are reflected
      // PrimeNG will automatically show selected tags if articleTags is an array of IDs
      console.log('All tags loaded for dropdown:', this.availableTags);
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

    // Inject Select2 extension code after DOM is ready
    this.injectSelect2Extensions();

    // Example: Fetch article by ID if present in route
    this.articleId = this.getArticleIdFromRoute();
    if (this.articleId) {
      this.getArticleById(this.articleId);
    }
  }

  // Get article ID from route (or another source)
  getArticleIdFromRoute(): number | null {
    // Example: get from route params
    const id = this.route.snapshot.paramMap.get('id');
    return id ? Number(id) : null;
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
  viewMedia(media: { url: string; type: 'image' | 'video' , id? : number}) {
    this.selectedMediaToView = media;
    const modal = document.getElementById('add-product-category');
    if (modal) {
      const bsModal = new (window as any).bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  // Remove media from previews and selected files
  removeMedia(index: number): void {
    const media = this.mediaPreviews[index];
    console.log('Removing media:', media); // AFFICHER IN LOGS

    if (media.id) {
      this.removedMedia.push(media.id);
      console.log('Media ID added to removedMedia:', media.id); // AFFICHER IN LOGS
    } else {
      const previewUrl = media.url;
      // Remove from removedMedia if present (avoid duplicates)
      this.removedMedia = this.removedMedia.filter(idOrUrl => idOrUrl !== previewUrl);
      // Find and remove from selectedMedia
      const fileIndex = this.selectedMedia.findIndex((file, idx) => {
        const added = this.addedMedia.find(am => am.previewUrl === previewUrl && am.file === file);
        return !!added;
      });
      if (fileIndex !== -1) {
        this.selectedMedia.splice(fileIndex, 1);
      }
      this.addedMedia = this.addedMedia.filter(item => item.previewUrl !== previewUrl);
      // Add previewUrl to removedMedia so backend can ignore it if needed
      this.removedMedia.push(previewUrl);
      console.log('Media removed from addedMedia:', previewUrl); // AFFICHER IN LOGS
    }
    this.mediaPreviews.splice(index, 1);

    // Log after update
    console.log('Current mediaPreviews:', this.mediaPreviews); // AFFICHER IN LOGS
    console.log('Current selectedMedia:', this.selectedMedia); // AFFICHER IN LOGS
    console.log('Current addedMedia:', this.addedMedia); // AFFICHER IN LOGS
    console.log('Current removedMedia:', this.removedMedia); // AFFICHER IN LOGS
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
          const previewUrl = e.target.result;
          // Remove any previous previewUrl from mediaPreviews and addedMedia
          this.mediaPreviews = this.mediaPreviews.filter(m => m.url !== previewUrl);
          this.addedMedia = this.addedMedia.filter(item => item.previewUrl !== previewUrl);
          // Remove from removedMedia if present (if user re-uploads a previously removed image)
          this.removedMedia = this.removedMedia.filter(idOrUrl => idOrUrl !== previewUrl);
          // Add new preview and media
          this.mediaPreviews.push({
            url: previewUrl,
            type: isImage ? 'image' : isVideo ? 'video' : 'image'
          });
          this.addedMedia.push({ file, previewUrl });
        };
        reader.readAsDataURL(file);
      }
    }
  }
  removeTag(index: number): void {
    this.articleTags.splice(index, 1);
  }

  // Log selected tags (IDs)
  onTagsChange() {
    console.log('Selected tag IDs:', this.articleTags);
  }

  // Submit article form
  async addArticle() {
    // Log all form values before validation
    console.log('Form values before submit:', {
      articleTitle: this.articleTitle,
      text: this.text,
      accessType: this.accessType,
      selectedCategory: this.selectedCategory,
      selectedCategoryFromSelect2: this.getSelectedCategoryFromSelect2(),
      articleTags: this.articleTags,
      selectedTags: this.getSelectedItemsPureWithIds(),
      selectedMedia: this.selectedMedia,
      articleTypes: this.articleTypes.filter(t => t.model).map(t => t.type)
    });


  
    // Validation: all fields required, at least one image
    if (!this.articleTitle.trim()) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Le titre est obligatoire.' });
      return;
    }
    if (!this.text.trim()) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'La description est obligatoire.' });
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

    // Log added and removed media before validation and API calls
    console.log('Médias ajoutés (files):', this.addedMedia);
    console.log('Médias supprimés (ids):', this.removedMedia);

/*     try {
      // 1. Create article (get article ID)
      const articlePayload = {
        title: this.articleTitle,
        content: this.text,
        isfree: this.accessType == 'gratuit' ? 1 : 0,
        type: this.articleTypes.filter(t => t.model).map(t => t.type).join(','),
      };

      console.log('Article payload:', articlePayload);

      if (this.articleId === null) {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'ID de l\'article manquant.' });
        throw new Error('Article ID is null');
      }
      const articleResp = await this.articleService.update(this.articleId, articlePayload).toPromise();
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
        category_id: this.selectedCategory
      }).toPromise();

      // 4. Link article to tags
      await Promise.all(
        this.articleTags.map(tag =>
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
    } */
  }

  annulerArticle() {
    // Redirection vers la liste des articles
    window.location.href = '/articles';
  }

  // Call this after changing selectedCategory to update Select2 UI
  updateSelect2Category() {
    const $select = $('.select[name="category"]');
    if ($select.length && $select.data('select2')) {
      $select.trigger('change.select2');
    }
  }

  // Call this after changing articleTags to update Select2 UI for tags
  updateSelect2Tags() {
    const $tagsSelect = $('.select[name="tags"]');
    if ($tagsSelect.length && $tagsSelect.data('select2')) {
      $tagsSelect.val(this.articleTags.map(String)).trigger('change');
    }
  }

  // Inject Select2 extension code for single/multiple selection
  injectSelect2Extensions() {
    const select2Code = `
      (function() {
        var amdDefine = window.define || (window.u && window.u.define);
        if (!amdDefine) return;
        amdDefine("select2/selection/single", ["jquery", "./base", "../utils", "../keys"], function(e, t, n, s) {
          function i() {
              i.__super__.constructor.apply(this, arguments)
          }
          return n.Extend(i, t),
          i.prototype.render = function() {
              var e = i.__super__.render.call(this);
              return e[0].classList.add("select2-selection--single"),
              e.html('<span class="select2-selection__rendered"></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span>'),
              e
          }
          ,
          i.prototype.bind = function(t, e) {
              var n = this;
              i.__super__.bind.apply(this, arguments);
              var s = t.id + "-container";
              this.$selection.find(".select2-selection__rendered").attr("id", s).attr("role", "textbox").attr("aria-readonly", "true"),
              this.$selection.attr("aria-labelledby", s),
              this.$selection.attr("aria-controls", s),
              this.$selection.on("mousedown", function(e) {
                  1 === e.which && n.trigger("toggle", {
                      originalEvent: e
                  })
              }),
              this.$selection.on("focus", function(e) {}),
              this.$selection.on("blur", function(e) {}),
              t.on("focus", function(e) {
                  t.isOpen() || n.$selection.trigger("focus")
              })
          }
          ,
          i.prototype.clear = function() {
              var e = this.$selection.find(".select2-selection__rendered");
              e.empty(),
              e.removeAttr("title")
          }
          ,
          i.prototype.display = function(e, t) {
              var n = this.options.get("templateSelection");
              return this.options.get("escapeMarkup")(n(e, t))
          }
          ,
          i.prototype.selectionContainer = function() {
              return e("<span></span>")
          }
          ,
          i.prototype.update = function(e) {
              var t, n;
              0 !== e.length ? (n = e[0],
              t = this.$selection.find(".select2-selection__rendered"),
              e = this.display(n, t),
              t.empty().append(e),
              (n = n.title || n.text) ? t.attr("title", n) : t.removeAttr("title")) : this.clear()
          }
          ,
          i
        });
        amdDefine("select2/selection/multiple", ["jquery", "./base", "../utils"], function(i, e, c) {
          function r(e, t) {
              r.__super__.constructor.apply(this, arguments)
          }
          return c.Extend(r, e),
          r.prototype.render = function() {
              var e = r.__super__.render.call(this);
              return e[0].classList.add("select2-selection--multiple"),
              e.html('<ul class="select2-selection__rendered"></ul>'),
              e
          }
          ,
          r.prototype.bind = function(e, t) {
              // Log all tags in the select element
              var tags = [];
              this.$element.find('option').each(function() {
              tags.push({
                  value: this.value,
                  text: this.text,
                  selected: this.selected
              });
              });
              console.log('Tags list:', tags);
              var n = this;
              r.__super__.bind.apply(this, arguments);
              var s = e.id + "-container";
              this.$selection.find(".select2-selection__rendered").attr("id", s),
              this.$selection.on("click", function(e) {
                  n.trigger("toggle", {
                      originalEvent: e
                  })
              }),
              this.$selection.on("click", ".select2-selection__choice__remove", function(e) {
                  var t;
                  n.isDisabled() || (t = i(this).parent(),
                  t = c.GetData(t[0], "data"),
                  n.trigger("unselect", {
                      originalEvent: e,
                      data: t
                  }))
              }),
              this.$selection.on("keydown", ".select2-selection__choice__remove", function(e) {
                  n.isDisabled() || e.stopPropagation()
              })
          }
          ,
          r.prototype.clear = function() {
              var e = this.$selection.find(".select2-selection__rendered");
              e.empty(),
              e.removeAttr("title")
          }
          ,
          r.prototype.display = function(e, t) {
              var n = this.options.get("templateSelection");
              return this.options.get("escapeMarkup")(n(e, t))
          }
          ,
          r.prototype.selectionContainer = function() {
              return i('<li class="select2-selection__choice"><button type="button" class="select2-selection__choice__remove" tabindex="-1"><span aria-hidden="true">&times;</span></button><span class="select2-selection__choice__display"></span></li>')
          }
          ,
          r.prototype.update = function(e) {
              if (this.clear(),
              0 !== e.length) {
                  for (var t = [], n = this.$selection.find(".select2-selection__rendered").attr("id") + "-choice-", s = 0; s < e.length; s++) {
                      var o = e[s],
                      r = this.display(o, n);
                      t.push(r),
                      (o = o.title || o.text) ? n.attr("title", o) : n.removeAttr("title")
                  }
                  this.$selection.find(".select2-selection__rendered").append(t),
                  this.$selection.find(".select2-selection__choice").attr("tabindex", "-1")
              }
          }
          ,
          r
        });
      })();
    `;
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = select2Code;
    document.body.appendChild(script);
  }
}

