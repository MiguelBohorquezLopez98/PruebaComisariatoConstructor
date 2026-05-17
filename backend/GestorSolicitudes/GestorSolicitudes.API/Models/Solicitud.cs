using System.ComponentModel.DataAnnotations;
using GestorSolicitudes.API.Models.Enums;

namespace GestorSolicitudes.API.Models;

public class Solicitud
{
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string Codigo { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Titulo { get; set; } = string.Empty;

    [Required]
    public string Descripcion { get; set; } = string.Empty;

    [Required]
    public AreaSolicitud Area { get; set; }

    [Required]
    public PrioridadSolicitud Prioridad { get; set; }

    [Required]
    public EstadoSolicitud Estado { get; set; } = EstadoSolicitud.Nueva;

    [MaxLength(100)]
    public string? Responsable { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaVencimiento { get; set; }
    public DateTime? FechaCierre { get; set; }

    public ICollection<HistorialEstado> Historial { get; set; } = new List<HistorialEstado>();
}