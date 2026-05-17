using System.ComponentModel.DataAnnotations;
using GestorSolicitudes.API.Models.Enums;

namespace GestorSolicitudes.API.Models;

public class HistorialEstado
{
    public int Id { get; set; }
    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;

    [Required]
    public EstadoSolicitud EstadoAnterior { get; set; }

    [Required]
    public EstadoSolicitud EstadoNuevo { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string CambiadoPor { get; set; } = string.Empty;

    public DateTime FechaCambio { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string? Observacion { get; set; }
}