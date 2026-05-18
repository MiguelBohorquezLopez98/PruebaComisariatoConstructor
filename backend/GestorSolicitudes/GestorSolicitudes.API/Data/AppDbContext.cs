using GestorSolicitudes.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GestorSolicitudes.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Solicitud> Solicitudes { get; set; }
    public DbSet<HistorialEstado> HistorialEstados { get; set; }

}