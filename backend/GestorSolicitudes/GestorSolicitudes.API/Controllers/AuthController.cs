using GestorSolicitudes.API.DTOs;
using GestorSolicitudes.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestorSolicitudes.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService,
        ILogger<AuthController> logger)
    { _authService = authService; _logger = logger; }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var resultado = _authService.Login(request);
        if (resultado == null)
            return Unauthorized(new { message = "Credenciales incorrectas" });
        return Ok(resultado);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var nombreUsuario = User.Identity?.Name;
        if (nombreUsuario == null) return Unauthorized();
        await _authService.LogoutAsync(nombreUsuario);
        return Ok(new { message = "Sesión cerrada correctamente" });
    }
}
