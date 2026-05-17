using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GestorSolicitudes.API.Data;
using GestorSolicitudes.API.DTOs;
using Microsoft.EntityFrameworkCore;
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
        usuario.TokenVersion++;
        _db.SaveChanges();
        _logger.LogInformation("Login exitoso: {Usuario}", request.NombreUsuario);
        return new LoginResponseDto
        {
            Token = GenerarToken(usuario.NombreUsuario, usuario.Rol, usuario.TokenVersion),
            Usuario = usuario.NombreUsuario,
            Rol = usuario.Rol
        };
    }

    public async Task LogoutAsync(string nombreUsuario)
    {
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(
            u => u.NombreUsuario == nombreUsuario);
        if (usuario != null)
        {
            usuario.TokenVersion++;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Logout: {Usuario}", nombreUsuario);
        }
    }

    private string GenerarToken(string nombreUsuario, string rol, int tokenVersion)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, nombreUsuario),
            new Claim(ClaimTypes.Role, rol),
            new Claim("token_version", tokenVersion.ToString())
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
