using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GestorSolicitudes.API.Data;
using GestorSolicitudes.API.DTOs;
using GestorSolicitudes.API.Services.Interfaces;
using Microsoft.IdentityModel.Tokens;


namespace GestorSolicitudes.API.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AppDbContext db, IConfiguration config, ILogger<AuthService> logger)
    {
        _db = db; _config = config; _logger = logger;
    }

    public LoginResponseDto? Login(LoginRequestDto request)
    {
        _logger.LogInformation("Intento de login: {Usuario}", request.NombreUsuario);
        var usuario = _db.Usuarios.FirstOrDefault(u => u.NombreUsuario == request.NombreUsuario);
        if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
        {
            _logger.LogWarning("Login fallido: {Usuario}", request.NombreUsuario);
            return null;
        }
        _logger.LogInformation("Login exitoso: {Usuario}", request.NombreUsuario);
        return new LoginResponseDto
        {
            Token = GenerarToken(usuario.NombreUsuario, usuario.Rol),
            Usuario = usuario.NombreUsuario,
            Rol = usuario.Rol
        };
    }

    private string GenerarToken(string nombreUsuario, string rol)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, nombreUsuario),
            new Claim(ClaimTypes.Role, rol)
        };
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:ExpireMinutes"]!)),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
