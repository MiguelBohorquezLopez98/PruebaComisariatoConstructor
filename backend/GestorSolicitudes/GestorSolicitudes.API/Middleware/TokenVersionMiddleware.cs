using GestorSolicitudes.API.Data;
using Microsoft.EntityFrameworkCore;

namespace GestorSolicitudes.API.Middleware;

public class TokenVersionMiddleware
{
    private readonly RequestDelegate _next;

    public TokenVersionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var nombreUsuario = context.User.Identity.Name;
            var versionClaim = context.User.FindFirst("token_version")?.Value;

            if (nombreUsuario == null || versionClaim == null ||
                !int.TryParse(versionClaim, out int versionToken))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }

            var usuario = await db.Usuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.NombreUsuario == nombreUsuario);

            if (usuario == null || usuario.TokenVersion != versionToken)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }
        }

        await _next(context);
    }
}
