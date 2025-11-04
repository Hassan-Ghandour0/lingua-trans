import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IpaService, IpaResponse } from './services/ipa.service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  [x: string]: any;
  language: 'ar-LB' | 'fr-FR' | 'en-US' = 'ar-LB';
  text = '';
  ipaOnly = '';
  loading = false;
  isStacked = false;
  copied = false;

  tagline = 'Turn any text into clean IPA — fast and accurate.';
  placeholder = 'اكتب النص هون… / Écrivez ici… / Type here…';

  private api = inject(IpaService);
  private textChanged = new Subject<void>();

  constructor() {
    this.textChanged.pipe(debounceTime(600)).subscribe(() => this.autoTranscribe());
    this.updateCopy();
  }

  setLang(lang: 'ar-LB' | 'fr-FR' | 'en-US') {
    this.language = lang;
    this.updateCopy();
    if (this.text.trim()) this.autoTranscribe();
  }
  swapPanels() { this.isStacked = !this.isStacked; }

  onInput() { this.textChanged.next(); }
  autoResize(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }
  
  copyIpa() {
    if (!this.ipaOnly) return;
    navigator.clipboard?.writeText(this.ipaOnly);
    this.copied = true;
    setTimeout(() => (this.copied = false), 900);
  }

  autoTranscribe(): void {
    const txt = this.text.trim();
    if (!txt) { this.ipaOnly = ''; return; }
    this.loading = true;
    this.api.transcribe({ language: this.language, text: txt })
      .subscribe({
        next: (r: IpaResponse) => { this.ipaOnly = r.ipa; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  @HostListener('document:keydown.control.enter') forceTranscribe() {
    if (this.text.trim()) this.autoTranscribe();
  }

  private updateCopy() {
    if (this.language === 'ar-LB') {
      this.tagline = 'حوّل أي نص إلى IPA واضح — بسرعة ودقة.';
      this.placeholder = 'اكتب النص هون…';
    } else if (this.language === 'fr-FR') {
      this.tagline = 'Transcrivez n’importe quel texte en API — clair et net.';
      this.placeholder = 'Écrivez votre texte ici…';
    } else {
      this.tagline = 'Turn any text into clean IPA — fast and accurate.';
      this.placeholder = 'Type or paste your text…';
    }
  }
}
