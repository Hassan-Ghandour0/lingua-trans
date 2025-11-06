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
  styleUrls: ['./app.component.scss']
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

  speaking = false;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.textChanged.pipe(debounceTime(600)).subscribe(() => this.autoTranscribe());
    this.updateCopy();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => this.voices = window.speechSynthesis.getVoices();
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  setLang(lang: 'ar-LB' | 'fr-FR' | 'en-US') {
    this.language = lang;
    this.updateCopy();
    if (this.text.trim()) this.autoTranscribe();
  }
  swapPanels() { this.isStacked = !this.isStacked; }

  onInput(ev: Event) {
    this.autoResize(ev);    
    this.textChanged.next();   
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
      this.tagline = 'حوّل النص إلى IPA — بسرعة، بوضوح، وبأعلى دقة.';
      this.placeholder = 'اكتب النص';
    } else if (this.language === 'fr-FR') {
      this.tagline = 'Transcrivez n’importe quel texte en API — clair et net.';
      this.placeholder = 'Écrivez votre texte ici…';
    } else {
      this.tagline = 'Turn any text into clean IPA — fast and accurate.';
      this.placeholder = 'Type or paste your text…';
    }
  }
    autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto'; // reset
    textarea.style.height = textarea.scrollHeight + 'px'; // set to full height
  }
  
  toggleSpeak() {
    if (this.speaking) {
      this.stopSpeak();
    } else {
      this.speakText();
    }
  }
  
  speakText() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
    const txt = this.text.trim(); 
    if (!txt) return;
  
    const lang = this.language === 'ar-LB' ? 'ar-LB' :
                 this.language === 'fr-FR' ? 'fr-FR' : 'en-US';
  
    const voice =
      this.voices.find(v => v.lang?.toLowerCase().startsWith(lang.toLowerCase())) ||
      this.voices.find(v => v.lang?.toLowerCase().startsWith(lang.split('-')[0])) ||
      undefined;
  
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = voice?.lang || lang;
    if (voice) u.voice = voice;
  
    u.rate = 1.0; u.pitch = 1.0; u.volume = 1.0;
  
    u.onstart = () => this.speaking = true;
    u.onend   = () => this.speaking = false;
    u.onerror = () => this.speaking = false;
  
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
  
  stopSpeak() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    this.speaking = false;
  }
  
}
