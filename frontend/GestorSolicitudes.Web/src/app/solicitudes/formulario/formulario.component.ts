import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { SolicitudService } from '../../core/services/solicitud.service';
import { AreaSolicitud, EstadoSolicitud, PrioridadSolicitud } from '../../shared/models/solicitud.model';

@Component({
  selector: 'app-formulario',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './formulario.component.html',
  styleUrl: './formulario.component.scss',
})
export class FormularioComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  form!: FormGroup;
  loading = false;
  guardando = false;
  esEdicion = false;
  solicitudId: number | null = null;
  esCerrada = false;

  readonly areas = Object.entries(AreaSolicitud)
    .filter(([, v]) => typeof v === 'number')
    .map(([k, v]) => ({ label: k, valor: v }));

  readonly prioridades = Object.entries(PrioridadSolicitud)
    .filter(([, v]) => typeof v === 'number')
    .map(([k, v]) => ({ label: k, valor: v }));

  constructor(
    private fb: FormBuilder,
    private service: SolicitudService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(120)]],
      descripcion: ['', Validators.required],
      area: ['', Validators.required],
      prioridad: ['', Validators.required],
      responsable: [''],
      fechaVencimiento: [null],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.solicitudId = +id;
      this.loading = true;
      this.service
        .getById(+id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (s) => {
            this.loading = false;
            if (s.estado === EstadoSolicitud.Cerrada) {
              this.esCerrada = true;
              this.form.disable();
            }
            this.form.patchValue({
              titulo: s.titulo,
              descripcion: s.descripcion,
              area: s.area,
              prioridad: s.prioridad,
              responsable: s.responsable,
              fechaVencimiento: s.fechaVencimiento ? new Date(s.fechaVencimiento) : null,
            });
            this.cdr.detectChanges();
          },
          error: () => {
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando = true;
    const datos = { ...this.form.value };
    if (datos.fechaVencimiento)
      datos.fechaVencimiento = new Date(datos.fechaVencimiento).toISOString();

    const obs = this.esEdicion
      ? this.service.update(this.solicitudId!, datos)
      : this.service.create(datos);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (s) => {
        this.guardando = false;
        this.snackBar.open('Solicitud guardada correctamente', 'OK', { duration: 3000 });
        this.router.navigate(['/solicitudes', s.id]);
      },
      error: () => {
        this.guardando = false;
        this.snackBar.open('Error al guardar la solicitud', 'Cerrar', { duration: 4000 });
        this.cdr.detectChanges();
      },
    });
  }
}
