using GestorSolicitudes.API.DTOs;

namespace GestorSolicitudes.API.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardResumenDto> GetResumenAsync();
}