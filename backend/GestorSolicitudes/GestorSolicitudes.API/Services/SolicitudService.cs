using GestorSolicitudes.API.Data;
using GestorSolicitudes.API.DTOs;
using GestorSolicitudes.API.Models;
using GestorSolicitudes.API.Models.Enums;
using GestorSolicitudes.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GestorSolicitudes.API.Services;

public class SolicitudService : ISolicitudService
{
    private readonly AppDbContext _db;
    private readonly ILogger<SolicitudService> _logger;

    public SolicitudService(AppDbContext db, ILogger<SolicitudService> logger)
    { _db = db; _logger = logger; }
    public async Task<object> GetAllAsync(string? estado, string? prioridad,
        string? texto, int page, int pageSize)
    {
        var query = _db.Solicitudes.Include(s => s.Historial).AsQueryable();
        if (!string.IsNullOrEmpty(estado) &&
            Enum.TryParse<EstadoSolicitud>(estado, out var e))
            query = query.Where(s => s.Estado == e);
        if (!string.IsNullOrEmpty(prioridad) &&
            Enum.TryParse<PrioridadSolicitud>(prioridad, out var p))
            query = query.Where(s => s.Prioridad == p);
        if (!string.IsNullOrEmpty(texto))
            query = query.Where(s => s.Titulo.Contains(texto) ||
                                     s.Descripcion.Contains(texto));
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(s => s.FechaCreacion)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        _logger.LogInformation("Listado solicitudes: {Total} resultados", total);
        return new { total, page, pageSize, items };
    }

    public async Task<Solicitud?> GetByIdAsync(int id) =>
        await _db.Solicitudes.Include(s => s.Historial)
            .FirstOrDefaultAsync(s => s.Id == id);

    public async Task<Solicitud> CreateAsync(CrearSolicitudDto dto)
    {
        var ultimo = await _db.Solicitudes
            .OrderByDescending(s => s.Id).FirstOrDefaultAsync();
        int siguiente = 1;
        if (ultimo != null)
        {
            var partes = ultimo.Codigo.Split('-');
            if (partes.Length == 3 && int.TryParse(partes[2], out int num))
                siguiente = num + 1;
        }
        var solicitud = new Solicitud
        {
            Codigo = $"SOL-{DateTime.UtcNow.Year}-{siguiente:D4}",
            Titulo = dto.Titulo,
            Descripcion = dto.Descripcion,
            Area = dto.Area,
            Prioridad = dto.Prioridad,
            Responsable = dto.Responsable,
            FechaVencimiento = dto.FechaVencimiento,
            FechaCreacion = DateTime.UtcNow,
            Estado = EstadoSolicitud.Nueva
        };
        _db.Solicitudes.Add(solicitud);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Solicitud creada: {Codigo}", solicitud.Codigo);
        return solicitud;
    }

    public async Task<Solicitud?> UpdateAsync(int id, CrearSolicitudDto dto)
    {
        var solicitud = await _db.Solicitudes.FindAsync(id);
        if (solicitud == null) return null;
        if (solicitud.Estado == EstadoSolicitud.Cerrada)
            throw new InvalidOperationException(
                "No se puede editar una solicitud Cerrada.");
        solicitud.Titulo = dto.Titulo;
        solicitud.Descripcion = dto.Descripcion;
        solicitud.Area = dto.Area;
        solicitud.Prioridad = dto.Prioridad;
        solicitud.Responsable = dto.Responsable;
        solicitud.FechaVencimiento = dto.FechaVencimiento;
        await _db.SaveChangesAsync();
        _logger.LogInformation("Solicitud actualizada: {Id}", id);
        return solicitud;
    }

    public async Task<Solicitud?> CambiarEstadoAsync(
        int id, CambiarEstadoDto dto, string usuarioActual)
    {
        var solicitud = await _db.Solicitudes.FindAsync(id);
        if (solicitud == null) return null;
        var historial = new HistorialEstado
        {
            SolicitudId = id,
            EstadoAnterior = solicitud.Estado,
            EstadoNuevo = dto.NuevoEstado,
            CambiadoPor = usuarioActual,
            FechaCambio = DateTime.UtcNow,
            Observacion = dto.Observacion
        };
        solicitud.Estado = dto.NuevoEstado;
        if (dto.NuevoEstado == EstadoSolicitud.Cerrada)
            solicitud.FechaCierre = DateTime.UtcNow;
        _db.HistorialEstados.Add(historial);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Estado cambiado {Id}: {Estado}",
            id, dto.NuevoEstado);
        return solicitud;
    }
}