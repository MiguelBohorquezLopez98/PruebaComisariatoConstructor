using GestorSolicitudes.API.DTOs;
using GestorSolicitudes.API.Models;

namespace GestorSolicitudes.API.Services.Interfaces;

public interface ISolicitudService
{
    Task<object> GetAllAsync(string? estado, string? prioridad, string? texto, int page, int pageSize);
    Task<Solicitud?> GetByIdAsync(int id);
    Task<Solicitud> CreateAsync(CrearSolicitudDto dto);
    Task<Solicitud?> UpdateAsync(int id, CrearSolicitudDto dto);
    Task<Solicitud?> CambiarEstadoAsync(int id, CambiarEstadoDto dto, string usuarioActual);
}