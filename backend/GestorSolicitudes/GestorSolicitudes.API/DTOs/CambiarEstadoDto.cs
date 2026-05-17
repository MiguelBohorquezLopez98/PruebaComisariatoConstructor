using System.ComponentModel.DataAnnotations;
using GestorSolicitudes.API.Models.Enums;

namespace GestorSolicitudes.API.DTOs;

public class CambiarEstadoDto
{
    [Required(ErrorMessage = "El nuevo estado es obligatorio")]
    public EstadoSolicitud NuevoEstado { get; set; }

    [MaxLength(500)]
    public string? Observacion { get; set; }
}