using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using sweetVenomServer.Data;
using sweetVenomServer.Models;

[Route("api/[controller]")]
[ApiController]
public class BiscuitsController : ControllerBase
{
    private readonly CakeShopContext _context;

    public BiscuitsController(CakeShopContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Biscuit>>> GetAll()
    {
        return await _context.Biscuits.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Biscuit>> GetById(int id)
    {
        var biscuit = await _context.Biscuits.FindAsync(id);
        if (biscuit == null) return NotFound();
        return biscuit;
    }

    [HttpPost]
    public async Task<ActionResult<Biscuit>> Create(Biscuit biscuit)
    {
        _context.Biscuits.Add(biscuit);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = biscuit.Id}, biscuit);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Biscuit biscuit)
    {
        if (id != biscuit.Id) return BadRequest();
        _context.Entry(biscuit).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var biscuit = await _context.Biscuits.FindAsync(id);
        if(biscuit == null) return NotFound();
        _context.Biscuits.Remove(biscuit);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}