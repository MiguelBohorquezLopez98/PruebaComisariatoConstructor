# ── Stage 1: Build .NET ───────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copia el csproj y restaura dependencias (capa cacheada)
COPY ["GestorSolicitudes.API.csproj", "."]
RUN dotnet restore

# Copia el resto del código y publica en modo Release
COPY . .
RUN dotnet publish -c Release -o /app/publish

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

WORKDIR /app
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "GestorSolicitudes.API.dll"]
