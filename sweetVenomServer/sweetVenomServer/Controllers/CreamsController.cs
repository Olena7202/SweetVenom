using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using sweetVenomServer.Data;
using sweetVenomServer.Models;

[Route("api/[controller]")]
[ApiController]
public class CreamsController : ControllerBase
{
    private readonly CakeShopContext _context;

    public CreamsController(CakeShopContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Cream>>> GetAll()
    {
        return await _context.Creams.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Cream>> GetById(int id)
    {
        var cream = await _context.Creams.FindAsync(id);
        if(cream == null) return NotFound();
        return cream;
    }

    [HttpPost]
    public async Task<ActionResult<Cream>> Create(Cream cream)
    {
        _context.Creams.Add(cream);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = cream.Id }, cream);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Cream cream)
    {
        if (id != cream.Id) return BadRequest();
        _context.Entry(cream).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var cream = await _context.Creams.FindAsync(id);
        if(cream == null) return NotFound();
        _context.Creams.Remove(cream);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}