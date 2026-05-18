import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DashboardService } from '../core/services/dashboard.service';
import { AuthService } from '../core/services/auth.service';
import { SolicitudService } from '../core/services/solicitud.service';
import { DashboardResumen } from '../shared/models/dashboard.model';
import {
  Solicitud,
  EstadoSolicitud,
  AreaSolicitud,
  PrioridadSolicitud,
} from '../shared/models/solicitud.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  resumen: DashboardResumen | null = null;
  loadingResumen = true;
  errorResumen = false;

  solicitudes: Solicitud[] = [];
  totalSolicitudes = 0;
  pageSolicitudes = 1;
  pageSizeSolicitudes = 10;
  loadingSolicitudes = true;
  errorSolicitudes = false;

  readonly EstadoSolicitud = EstadoSolicitud;
  readonly AreaSolicitud = AreaSolicitud;
  readonly PrioridadSolicitud = PrioridadSolicitud;
  readonly displayedColumns = ['codigo', 'titulo', 'area', 'prioridad', 'estado', 'vencimiento', 'acciones'];

  usuario: { usuario: string; rol: string } | null = null;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private solicitudService: SolicitudService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.cargarResumen();
    this.cargarSolicitudes();
  }

  cargarResumen(): void {
    this.loadingResumen = true;
    this.errorResumen = false;
    this.dashboardService.getResumen().subscribe({
      next: (data) => {
        this.resumen = data;
        this.loadingResumen = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorResumen = true;
        this.loadingResumen = false;
        this.cdr.detectChanges();
      },
    });
  }

  cargarSolicitudes(): void {
    this.loadingSolicitudes = true;
    this.errorSolicitudes = false;
    this.solicitudService
      .getAll({ page: this.pageSolicitudes, pageSize: this.pageSizeSolicitudes })
      .subscribe({
        next: (res) => {
          this.solicitudes = res.items;
          this.totalSolicitudes = res.total;
          this.loadingSolicitudes = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorSolicitudes = true;
          this.loadingSolicitudes = false;
          this.cdr.detectChanges();
        },
      });
  }

  onPage(event: PageEvent): void {
    this.pageSolicitudes = event.pageIndex + 1;
    this.pageSizeSolicitudes = event.pageSize;
    this.cargarSolicitudes();
  }

  getAreaLabel(area: AreaSolicitud): string {
    return AreaSolicitud[area] ?? String(area);
  }

  getPrioridadLabel(prioridad: PrioridadSolicitud): string {
    return PrioridadSolicitud[prioridad] ?? String(prioridad);
  }

  getEstadoLabel(estado: EstadoSolicitud): string {
    return EstadoSolicitud[estado] ?? String(estado);
  }

  esCritica(s: Solicitud): boolean {
    return s.prioridad === PrioridadSolicitud.Critica;
  }

  esVencida(s: Solicitud): boolean {
    if (!s.fechaVencimiento) return false;
    return new Date(s.fechaVencimiento) < new Date() && s.estado !== EstadoSolicitud.Cerrada;
  }

  logout(): void {
    this.authService.logout();
  }
}
