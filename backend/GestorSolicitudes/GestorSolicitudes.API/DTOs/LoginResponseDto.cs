namespace GestorSolicitudes.API.DTOs;

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;

}