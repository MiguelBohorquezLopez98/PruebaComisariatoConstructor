using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GestorSolicitudes.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Seed data ya no se gestiona por migraciones sino en Program.cs
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "NombreUsuario", "PasswordHash", "Rol", "TokenVersion" },
                values: new object[,]
                {
                    { 1, "admin", "$2a$11$fntNKPeiEkDW2bDYoptNE.8.cBZRDF4oF9wra8hI/JyH7dg1Cwn..", "admin", 1 },
                    { 2, "operador", "$2a$11$Y3B8syGeg/1I9bUnJ9dDvuB7sZpDbXYfZMJZhElMr20i2r5haY/le", "operador", 1 }
                });
        }
    }
}
