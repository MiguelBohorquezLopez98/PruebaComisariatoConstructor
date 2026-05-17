namespace GestorSolicitudes.API.DTOs;

public class DashboardResumenDto
{
    public int Total { get; set; }
    public int Abiertas { get; set; }
    public int Criticas { get; set; }
    public int Vencidas { get; set; }
    public int Cerradas { get; set; }
}