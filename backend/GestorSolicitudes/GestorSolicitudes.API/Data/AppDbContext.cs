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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>().HasData(
            new Usuario {
                Id = 1,
                NombreUsuario = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123*"),
                Rol = "admin"
            },
            new Usuario {
                Id = 2,
                NombreUsuario = "operador",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Operador123*"),
                Rol = "operador"
            }
        );
    }
}