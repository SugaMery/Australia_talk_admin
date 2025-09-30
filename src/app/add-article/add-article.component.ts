import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-add-article',
  templateUrl: './add-article.component.html',
  styleUrl: './add-article.component.css'
})
export class AddArticleComponent implements OnInit {
  ngOnInit() {
    // Log first phrase/text in page
    setTimeout(() => {
      const firstPhrase = document.body.innerText.trim().split('\n')[0];
      console.log('First phrase in page:', firstPhrase);
    }, 0);

    // Load Select2 CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'assets/scss/vendors/_select2.scss';
    document.head.appendChild(link);

    // Load Select2 JS
    const script = document.createElement('script');
    script.src = 'assets/plugins/select2/js/select2.min.js';
    script.async = true;
    document.body.appendChild(script);
  }


                            articleTitle: string = '';
                                categories = [
                                    { label: 'Technology', value: 'technology' },
                                    { label: 'Health', value: 'health' },
                                    { label: 'Business', value: 'business' },
                                    { label: 'Education', value: 'education' }
                                    // Add more categories as needed
                                ];
                                selectedCategory: any = null;
                                isFree: boolean = false;
                                isGratuite: boolean = false;
                                text: string = '';
}
