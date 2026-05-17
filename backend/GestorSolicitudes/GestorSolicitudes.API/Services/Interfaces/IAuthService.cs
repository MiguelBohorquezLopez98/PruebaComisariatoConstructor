using GestorSolicitudes.API.DTOs;

namespace GestorSolicitudes.API.Services.Interfaces;

public interface IAuthService
{
    LoginResponseDto? Login(LoginRequestDto request);
}