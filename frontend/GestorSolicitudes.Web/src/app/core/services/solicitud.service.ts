import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Solicitud,
  CrearSolicitudDto,
  CambiarEstadoDto,
  PagedResult,
} from '../../shared/models/solicitud.model';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private url = `${environment.apiUrl}/solicitudes`;

  constructor(private http: HttpClient) {}

  getAll(filtros: {
    estado?: string;
    prioridad?: string;
    texto?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PagedResult<Solicitud>> {
    let params = new HttpParams();
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.prioridad) params = params.set('prioridad', filtros.prioridad);
    if (filtros.texto) params = params.set('texto', filtros.texto);
    params = params.set('page', filtros.page ?? 1);
    params = params.set('pageSize', filtros.pageSize ?? 10);
    return this.http.get<PagedResult<Solicitud>>(this.url, { params });
  }

  getById(id: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.url}/${id}`);
  }
  create(dto: CrearSolicitudDto): Observable<Solicitud> {
    return this.http.post<Solicitud>(this.url, dto);
  }

  update(id: number, dto: CrearSolicitudDto): Observable<Solicitud> {
    return this.http.put<Solicitud>(`${this.url}/${id}`, dto);
  }

  cambiarEstado(id: number, dto: CambiarEstadoDto): Observable<Solicitud> {
    return this.http.patch<Solicitud>(`${this.url}/${id}/estado`, dto);
  }
}
