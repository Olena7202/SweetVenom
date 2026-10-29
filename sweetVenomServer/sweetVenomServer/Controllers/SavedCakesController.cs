using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using sweetVenomServer.Data;
using sweetVenomServer.Models;

[Route("api/[controller]")]
[ApiController]
public class SavedCakesController : ControllerBase
{
    private readonly CakeShopContext _context;

    public SavedCakesController(CakeShopContext context)
    {
        _context = context;
    }

    // GET: api/savedcakes/client/1
    [HttpGet("client/{clientId}")]
    public async Task<ActionResult<IEnumerable<SavedCake>>> GetByClient(int clientId)
    {
        return await _context.SavedCakes
            .Where(s => s.ClientId == clientId)
            .Include(s => s.Cake)
            .ToListAsync();
    }

    // POST: api/savedcakes
    [HttpPost]
    public async Task<ActionResult<SavedCake>> Save(SavedCake savedCake)
    {
        var already = await _context.SavedCakes
            .AnyAsync(s => s.ClientId == savedCake.ClientId && s.CakeId == savedCake.CakeId);
        if (already) return BadRequest("Already saved");

        savedCake.SavedAt = DateTime.UtcNow;
        _context.SavedCakes.Add(savedCake);
        await _context.SaveChangesAsync();
        return Ok(savedCake);
    }

    // DELETE: api/savedcakes/1
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var saved = await _context.SavedCakes.FindAsync(id);
        if (saved == null) return NotFound();
        _context.SavedCakes.Remove(saved);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}