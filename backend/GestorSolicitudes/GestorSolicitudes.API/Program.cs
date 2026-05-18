using System.Text;
using GestorSolicitudes.API.Data;
using GestorSolicitudes.API.Middleware;
using GestorSolicitudes.API.Services;
using GestorSolicitudes.API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Base de datos
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// Inyeccion de dependencias
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISolicitudService, SolicitudService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// CORS para Angular
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader().AllowAnyMethod());
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();

// Swagger con soporte Bearer JWT
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new OpenApiInfo {
        Title = "Gestor Solicitudes API", Version = "v1",
        Description = "API para gestion de solicitudes internas"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme {
        Description = "JWT: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {{
        new OpenApiSecurityScheme {
            Reference = new OpenApiReference {
                Type = ReferenceType.SecurityScheme, Id = "Bearer" }},
        Array.Empty<string>() }});
});

var app = builder.Build();

// CORS manual: agrega headers en TODA respuesta y cortocircuita OPTIONS
app.Use(async (context, next) =>
{
    var corsOrigin = app.Configuration["CorsOrigin"] ?? "http://localhost:4200";
    context.Response.Headers["Access-Control-Allow-Origin"] = corsOrigin;
    context.Response.Headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
    context.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 204;
        return;
    }

    await next();
});

// Middleware de errores global
app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<TokenVersionMiddleware>();

// Health check
app.MapGet("/health", () => Results.Ok(new {
    status = "ok", timestamp = DateTime.UtcNow }));

app.MapControllers();

// Migraciones automáticas y seed de usuarios iniciales
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    if (!db.Usuarios.Any())
    {
        db.Usuarios.AddRange(
            new GestorSolicitudes.API.Models.Usuario
            {
                NombreUsuario = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin1234!"),
                Rol = "admin"
            },
            new GestorSolicitudes.API.Models.Usuario
            {
                NombreUsuario = "operador",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Operador1234!"),
                Rol = "operador"
            }
        );
        db.SaveChanges();
    }
}

app.Run();