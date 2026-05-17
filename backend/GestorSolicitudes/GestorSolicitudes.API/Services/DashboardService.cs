using GestorSolicitudes.API.Data;
using GestorSolicitudes.API.DTOs;
using GestorSolicitudes.API.Models.Enums;
using GestorSolicitudes.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GestorSolicitudes.API.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(AppDbContext db, ILogger<DashboardService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<DashboardResumenDto> GetResumenAsync()
    {
        var hoy = DateTime.UtcNow;
        var resumen = new DashboardResumenDto
        {
            Total = await _db.Solicitudes.CountAsync(),
            Abiertas = await _db.Solicitudes.CountAsync(s =>
                s.Estado != EstadoSolicitud.Cerrada &&
                s.Estado != EstadoSolicitud.Cancelada),
            Criticas = await _db.Solicitudes.CountAsync(s =>
                s.Prioridad == PrioridadSolicitud.Critica &&
                s.Estado != EstadoSolicitud.Cerrada),
            Vencidas = await _db.Solicitudes.CountAsync(s =>
                s.FechaVencimiento < hoy &&
                s.Estado != EstadoSolicitud.Cerrada),
            Cerradas = await _db.Solicitudes.CountAsync(s =>
                s.Estado == EstadoSolicitud.Cerrada)
        };
        _logger.LogInformation("Dashboard: {Total} totales", resumen.Total);
        return resumen;
    }
}