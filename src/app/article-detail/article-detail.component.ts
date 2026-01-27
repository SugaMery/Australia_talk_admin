import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../services/article.service';
import { MessageService } from 'primeng/api';

interface Article {
  id: number;
  title: string;
  content?: string;
  slug?: string;
  type?: string;
  isfree?: number | boolean;
  status?: string;
  views_count?: number;
  likes_count?: number;
  media?: any[];
  author?: { first_name: string; last_name: string; avatar?: string };
  categories?: { id: number; name: string; type?: string }[];
  tags?: any[];
  created_at?: string;
  updated_at?: string;
  path?: string;
  filename?: string;
}

@Component({
  selector: 'app-article-detail',
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.css'],
  providers: [MessageService]
})
export class ArticleDetailComponent implements OnInit {
  article: any | null = null;
  loading: boolean = true;
  notFound: boolean = false;
  articleId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.articleId = +params['id'];
      if (this.articleId) {
        this.loadArticle();
      }
    });
  }

  loadArticle() {
    this.loading = true;
    this.articleService.getRelated(this.articleId!).subscribe({
      next: (response: any) => {
        console.log('Article loaded:', response);
        // Merge top-level data into article object
        if (response.article) {
          this.article = {
            ...response.article,
            media: response.media || response.article.media,
            author: response.author || response.article.author,
            tags: response.tags || response.article.tags,
            categories: response.categories || response.article.categories
          };
        } else {
          this.article = response;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notFound = true;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Article non trouvé'
        });
      }
    });
  }

  getMainImageUrl(): string {
    if (this.article && this.article.media && this.article.media.length > 0) {
      const mainMedia = this.article.media[0];
      // Check if it's an image (JPEG, PNG, etc.)
      if (mainMedia.extension && (mainMedia.extension === 'jpeg' || mainMedia.extension === 'jpg' || mainMedia.extension === 'png')) {
        return mainMedia.path;
      }
      // If first media is video, look for image
      for (let media of this.article.media) {
        if (media.extension && (media.extension === 'jpeg' || media.extension === 'jpg' || media.extension === 'png')) {
          return media.path;
        }
      }
    }
    return 'assets/img/products/stock-img-01.png';
  }

  onImageError(event: any): void {
    // Fallback image when image fails to load
    event.target.src = 'assets/img/products/stock-img-01.png';
  }

  getStatusBadgeClass(status: string | undefined): string {
    switch (status) {
      case 'published':
        return 'badge-primary';
      case 'pending':
        return 'badge-warning';
      case 'draft':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'published':
        return 'Publié';
      case 'pending':
        return 'En attente';
      case 'draft':
        return 'Brouillon';
      default:
        return status || 'Non spécifié';
    }
  }

  goBack() {
    this.router.navigate(['/articles']);
  }

  editArticle() {
    if (this.article) {
      this.router.navigate(['/edit-article', this.article.id]);
    }
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  incrementViewCount() {
    if (this.article) {
      this.article.views_count = (this.article.views_count || 0) + 1;
    }
  }
}
