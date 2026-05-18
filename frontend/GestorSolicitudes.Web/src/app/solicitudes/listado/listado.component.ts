import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SolicitudService } from '../../core/services/solicitud.service';
import {
  Solicitud,
  EstadoSolicitud,
  AreaSolicitud,
  PrioridadSolicitud,
} from '../../shared/models/solicitud.model';
import { Subject, EMPTY } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
export class ListadoComponent implements OnInit {
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

  filtros!: FormGroup;

  private readonly buscar$ = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private service: SolicitudService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filtros = this.fb.group({
      texto: [''],
      estado: [''],
      prioridad: [''],
    });

    // switchMap cancela el request anterior si llega uno nuevo
    this.buscar$
      .pipe(
        switchMap(() => {
          this.loading = true;
          this.error = false;
          this.cdr.detectChanges();
          const f = this.filtros.value;
          return this.service
            .getAll({
              estado: f.estado || undefined,
              prioridad: f.prioridad || undefined,
              texto: f.texto || undefined,
              page: this.page,
              pageSize: this.pageSize,
            })
            .pipe(
              catchError(() => {
                this.error = true;
                this.loading = false;
                this.cdr.detectChanges();
                return EMPTY;
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.solicitudes = res.items;
        this.total = res.total;
        this.loading = false;
        this.cdr.detectChanges();
      });

    // Texto: espera 400ms después del último tecleo
    this.filtros
      .get('texto')!
      .valueChanges.pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.buscar$.next();
      });

    // Dropdowns: reacción inmediata
    this.filtros
      .get('estado')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.buscar$.next();
      });

    this.filtros
      .get('prioridad')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.buscar$.next();
      });

    // Carga inicial
    this.buscar$.next();
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.buscar$.next();
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
