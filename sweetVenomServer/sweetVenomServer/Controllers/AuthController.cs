using Microsoft.AspNetCore.Authorization;
using System.Text.RegularExpressions;
﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using sweetVenomServer.Data;
using sweetVenomServer.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly CakeShopContext _context;
    private readonly IConfiguration _config;

    public AuthController(CakeShopContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if(await _context.Users.AnyAsync(u => u.Email == dto.Email))
        {
            return BadRequest("Email already exists!");
        }

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Phone = dto.Phone,
            Role = dto.Role,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User registered successfully!" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash)) {
            return Unauthorized("Invalid email or password!");
        }

        var token = GenerateToken(user);
        return Ok(new {token, role = user.Role, userId = user.Id, name = user.Name, email = user.Email, phone = user.Phone});
    }


    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileDto dto)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var name = dto.Name.Trim();
        var email = dto.Email.Trim().ToLowerInvariant();
        var rawPhone = dto.Phone.Trim();
        var digits = Regex.Replace(rawPhone, @"[^0-9]", "");
        if (name.Length < 2 || name.Length > 100)
            return BadRequest(new { message = "Вкажи ім’я від 2 до 100 символів." });
        if (!Regex.IsMatch(rawPhone, @"^[+]?[0-9 ().-]+$") || digits.Length < 7 || digits.Length > 15)
            return BadRequest(new { message = "Вкажи коректний телефон: від 7 до 15 цифр." });
        if (await _context.Users.AnyAsync(u => u.Id != userId && u.Email == email))
            return Conflict(new { message = "Цей email уже використовується іншим акаунтом." });

        user.Name = name;
        user.Email = email;
        user.Phone = (rawPhone.StartsWith("+") ? "+" : "") + digits;
        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateException)
        {
            if (await _context.Users.AnyAsync(u => u.Id != userId && u.Email == email))
                return Conflict(new { message = "Цей email уже використовується іншим акаунтом." });
            throw;
        }

        return Ok(new { token = GenerateToken(user), role = user.Role, userId = user.Id,
            name = user.Name, email = user.Email, phone = user.Phone });
    }

    private string GenerateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(ClaimTypes.Name, user.Name)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
        
    }
}
