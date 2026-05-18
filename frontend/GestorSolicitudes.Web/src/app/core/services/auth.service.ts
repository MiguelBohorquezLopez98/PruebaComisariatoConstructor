import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../../shared/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((res) => {
        sessionStorage.setItem(this.TOKEN_KEY, res.token);
        sessionStorage.setItem(
          this.USER_KEY,
          JSON.stringify({ usuario: res.usuario, rol: res.rol }),
        );
      }),
    );
  }

  logout(): void {
    const token = this.getToken();
    // Limpia la sesión ANTES del HTTP para que el interceptor no entre en loop
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    if (token) {
      // Intenta invalidar el token en el servidor (best-effort, no bloquea la navegación)
      this.http
        .post(`${environment.apiUrl}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .subscribe({ error: () => {} });
    }
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUsuario(): { usuario: string; rol: string } | null {
    const data = sessionStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }
}
