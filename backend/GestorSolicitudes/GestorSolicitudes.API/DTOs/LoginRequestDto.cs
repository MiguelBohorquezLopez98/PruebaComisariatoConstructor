using System.ComponentModel.DataAnnotations;

namespace GestorSolicitudes.API.DTOs;

public class LoginRequestDto
{
    [Required(ErrorMessage = "El nombre de usuario es obligatorio")]
    public string NombreUsuario { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contrasena es obligatoria")]
    public string Password { get; set; } = string.Empty;
}