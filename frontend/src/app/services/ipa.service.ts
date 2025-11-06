import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface IpaRequest { language: string; text: string; }
export interface IpaResponse { language: string; originalText: string; ipa: string; }

@Injectable({ providedIn: 'root' })
export class IpaService {
  private base = environment.API_URL;  

  constructor(private http: HttpClient) {}

  transcribe(payload: IpaRequest): Observable<IpaResponse> {
    return this.http.post<IpaResponse>(`${this.base}/transcribe`, payload);
  }

  health(): Observable<string> {
    return this.http.get(`${this.base}/health`, { responseType: 'text' });
  }

}
