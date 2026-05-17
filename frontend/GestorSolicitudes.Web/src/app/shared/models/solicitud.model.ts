export enum AreaSolicitud {
  Sistemas = 0,
  Bodega = 1,
  Compras = 2,
  Ventas = 3,
  TalentoHumano = 4,
  Mantenimiento = 5,
}

export enum PrioridadSolicitud {
  Baja = 0,
  Media = 1,
  Alta = 2,
  Critica = 3,
}

export enum EstadoSolicitud {
  Nueva = 0,
  EnProceso = 1,
  EnEspera = 2,
  Cerrada = 3,
  Cancelada = 4,
}

export interface HistorialEstado {
  id: number;
  solicitudId: number;
  estadoAnterior: EstadoSolicitud;
  estadoNuevo: EstadoSolicitud;
  cambiadoPor: string;
  fechaCambio: string;
  observacion?: string;
}

export interface Solicitud {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  area: AreaSolicitud;
  prioridad: PrioridadSolicitud;
  estado: EstadoSolicitud;
  responsable?: string;
  fechaCreacion: string;
  fechaVencimiento?: string;
  fechaCierre?: string;
  historial: HistorialEstado[];
}

export interface CrearSolicitudDto {
  titulo: string;
  descripcion: string;
  area: AreaSolicitud;
  prioridad: PrioridadSolicitud;
  responsable?: string;
  fechaVencimiento?: string;
}

export interface CambiarEstadoDto {
  nuevoEstado: EstadoSolicitud;
  observacion?: string;
}

export interface PagedResult<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}
