import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },

  {
    path: 'solicitudes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./solicitudes/listado/listado.component').then((m) => m.ListadoComponent),
  },

  {
    path: 'solicitudes/nueva',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./solicitudes/formulario/formulario.component').then((m) => m.FormularioComponent),
  },

  {
    path: 'solicitudes/editar/:id',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./solicitudes/formulario/formulario.component').then((m) => m.FormularioComponent),
  },

  {
    path: 'solicitudes/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./solicitudes/detalle/detalle.component').then((m) => m.DetalleComponent),
  },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
