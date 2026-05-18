import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { SolicitudService } from '../../core/services/solicitud.service';
import {
  Solicitud,
  EstadoSolicitud,
  AreaSolicitud,
  PrioridadSolicitud,
} from '../../shared/models/solicitud.model';

@Component({
  selector: 'app-listado',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './listado.component.html',
  styleUrl: './listado.component.scss',
})
export class ListadoComponent implements OnInit, OnDestroy {
  solicitudes: Solicitud[] = [];
  total = 0;
  page = 1;
  pageSize = 10;
  loading = false;
  error = false;

  readonly displayedColumns = ['codigo', 'titulo', 'area', 'prioridad', 'estado', 'vencimiento', 'acciones'];
  readonly EstadoSolicitud = EstadoSolicitud;
  readonly PrioridadSolicitud = PrioridadSolicitud;
  readonly AreaSolicitud = AreaSolicitud;

  readonly estadoOpciones = [
    { valor: '', label: 'Todos' },
    { valor: 'Nueva', label: 'Nueva' },
    { valor: 'EnProceso', label: 'En Proceso' },
    { valor: 'EnEspera', label: 'En Espera' },
    { valor: 'Cerrada', label: 'Cerrada' },
    { valor: 'Cancelada', label: 'Cancelada' },
  ];

  readonly prioridadOpciones = [
    { valor: '', label: 'Todas' },
    { valor: 'Baja', label: 'Baja' },
    { valor: 'Media', label: 'Media' },
    { valor: 'Alta', label: 'Alta' },
    { valor: 'Critica', label: 'Critica' },
  ];

  filtros: FormGroup;

  private cargandoSub: Subscription | null = null;
  private textoTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private service: SolicitudService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.filtros = this.fb.group({
      texto: [''],
      estado: [''],
      prioridad: [''],
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.cargandoSub?.unsubscribe();
    if (this.textoTimer) clearTimeout(this.textoTimer);
  }

  onTextoInput(): void {
    if (this.textoTimer) clearTimeout(this.textoTimer);
    this.textoTimer = setTimeout(() => {
      this.page = 1;
      this.cargar();
    }, 400);
  }

  onEstadoChange(event: MatSelectChange): void {
    this.page = 1;
    this.cargar();
  }

  onPrioridadChange(event: MatSelectChange): void {
    this.page = 1;
    this.cargar();
  }

  cargar(): void {
    this.cargandoSub?.unsubscribe();
    this.loading = true;
    this.error = false;
    this.cdr.detectChanges();

    const f = this.filtros.value as { texto: string; estado: string; prioridad: string };

    this.cargandoSub = this.service
      .getAll({
        estado: f.estado || undefined,
        prioridad: f.prioridad || undefined,
        texto: f.texto || undefined,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.solicitudes = res.items;
          this.total = res.total;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = true;
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargar();
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
}
