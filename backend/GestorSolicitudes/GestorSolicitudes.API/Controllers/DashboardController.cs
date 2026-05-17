using GestorSolicitudes.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestorSolicitudes.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;
    public DashboardController(IDashboardService service)
    { _service = service; }

    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumen()
    {
        var resumen = await _service.GetResumenAsync();
        return Ok(resumen);
    }
}
