using System.ComponentModel.DataAnnotations;

namespace GestorSolicitudes.API.Models;

public class Usuario
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string NombreUsuario { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Rol { get; set; } = string.Empty;

    public int TokenVersion { get; set; } = 1;
}