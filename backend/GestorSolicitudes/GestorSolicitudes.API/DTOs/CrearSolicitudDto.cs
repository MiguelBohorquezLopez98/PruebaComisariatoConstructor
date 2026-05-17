using System.ComponentModel.DataAnnotations;
using GestorSolicitudes.API.Models.Enums;

namespace GestorSolicitudes.API.DTOs;

public class CrearSolicitudDto
{
    [Required(ErrorMessage = "El titulo es obligatorio")]
    [MaxLength(120, ErrorMessage = "El titulo no puede superar 120 caracteres")]
    public string Titulo { get; set; } = string.Empty;

    [Required(ErrorMessage = "La descripcion es obligatoria")]
    public string Descripcion { get; set; } = string.Empty;

    [Required(ErrorMessage = "El area es obligatoria")]
    public AreaSolicitud Area { get; set; }

    [Required(ErrorMessage = "La prioridad es obligatoria")]
    public PrioridadSolicitud Prioridad { get; set; }

    public string? Responsable { get; set; }
    public DateTime? FechaVencimiento { get; set; }
}