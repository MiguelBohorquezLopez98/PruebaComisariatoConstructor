using GestorSolicitudes.API.DTOs;
using GestorSolicitudes.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestorSolicitudes.API.Controllers;

[ApiController]
[Route("api/solicitudes")]
[Authorize]
public class SolicitudesController : ControllerBase
{
    private readonly ISolicitudService _service;
    private readonly ILogger<SolicitudesController> _logger;

    public SolicitudesController(ISolicitudService service,
        ILogger<SolicitudesController> logger)
    { _service = service; _logger = logger; }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? estado, [FromQuery] string? prioridad,
        [FromQuery] string? texto,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var resultado = await _service.GetAllAsync(
            estado, prioridad, texto, page, pageSize);
        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var s = await _service.GetByIdAsync(id);
        if (s == null) return NotFound(new { message = "Solicitud no encontrada" });
        return Ok(s);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CrearSolicitudDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var s = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = s.Id }, s);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(
        int id, [FromBody] CrearSolicitudDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var s = await _service.UpdateAsync(id, dto);
        if (s == null) return NotFound(new { message = "Solicitud no encontrada" });
        return Ok(s);
    }

    [HttpPatch("{id}/estado")]
    [Authorize]
    public async Task<IActionResult> CambiarEstado(
        int id, [FromBody] CambiarEstadoDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var usuario = User.Identity?.Name ?? "sistema";
        if (!User.IsInRole("admin"))
        {
            var solicitud = await _service.GetByIdAsync(id);
            if (solicitud == null) return NotFound(new { message = "Solicitud no encontrada" });
            if (solicitud.Responsable != usuario)
                return Forbid();
        }
        var s = await _service.CambiarEstadoAsync(id, dto, usuario);
        if (s == null) return NotFound(new { message = "Solicitud no encontrada" });
        return Ok(s);
    }
}