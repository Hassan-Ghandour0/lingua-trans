import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment as env } from '../../environments/environment';

export interface IpaRequest {
  language: 'ar-LB' | 'fr-FR' | 'en-US';
  text: string;
}
export interface IpaResponse {
  language: string;
  originalText: string;
  ipa: string;
}

@Injectable({ providedIn: 'root' })
export class IpaService {
  private http = inject(HttpClient);

  transcribe(body: IpaRequest) {
    const url = `${env.API_URL}/ipa/transcribe`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<IpaResponse>(url, body, { headers });
  }
}
