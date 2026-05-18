import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { SolicitudService } from '../../core/services/solicitud.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Solicitud,
  EstadoSolicitud,
  AreaSolicitud,
  PrioridadSolicitud,
} from '../../shared/models/solicitud.model';

@Component({
  selector: 'app-detalle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.scss',
})
export class DetalleComponent implements OnInit {
  solicitud: Solicitud | null = null;
  loading = true;
  cambiandoEstado = false;

  readonly esAdmin: boolean;
  readonly usuario: { usuario: string; rol: string } | null;
  readonly EstadoSolicitud = EstadoSolicitud;
  readonly AreaSolicitud = AreaSolicitud;
  readonly PrioridadSolicitud = PrioridadSolicitud;

  readonly estadoOpciones = [
    { valor: EstadoSolicitud.Nueva, label: 'Nueva' },
    { valor: EstadoSolicitud.EnProceso, label: 'En Proceso' },
    { valor: EstadoSolicitud.EnEspera, label: 'En Espera' },
    { valor: EstadoSolicitud.Cerrada, label: 'Cerrada' },
    { valor: EstadoSolicitud.Cancelada, label: 'Cancelada' },
  ];

  estadoForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private service: SolicitudService,
    private auth: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {
    this.esAdmin = this.auth.esAdmin();
    this.usuario = this.auth.getUsuario();
    this.estadoForm = this.fb.group({
      nuevoEstado: ['', Validators.required],
      observacion: [''],
    });
  }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.cargar(id);
  }

  private cargar(id: number): void {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (s) => {
        this.solicitud = s;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  cambiarEstado(): void {
    if (this.estadoForm.invalid || !this.solicitud) return;
    this.cambiandoEstado = true;
    const id = this.solicitud.id;
    this.service
      .cambiarEstado(id, {
        nuevoEstado: +this.estadoForm.value.nuevoEstado,
        observacion: this.estadoForm.value.observacion || undefined,
      })
      .subscribe({
        next: () => {
          this.estadoForm.reset();
          this.cargar(id);
          this.cambiandoEstado = false;
          this.snackBar.open('Estado actualizado', 'OK', { duration: 3000 });
          this.cdr.detectChanges();
        },
        error: () => {
          this.cambiandoEstado = false;
          this.snackBar.open('Error al actualizar el estado', 'Cerrar', { duration: 4000 });
          this.cdr.detectChanges();
        },
      });
  }

  puedeActualizarEstado(): boolean {
    if (this.esAdmin) return true;
    if (!this.solicitud || !this.usuario) return false;
    return this.solicitud.responsable === this.usuario.usuario;
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
}
