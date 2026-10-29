using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using sweetVenomServer.Data;
using sweetVenomServer.Models;

[Route("api/[controller]")]
[ApiController]
public class CategoriesController : ControllerBase
{
    private readonly CakeShopContext _context;

    public CategoriesController(CakeShopContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetAll()
    {
        return await _context.Categories.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Category>> GetById(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound();
        return category;
    }

    [HttpPost]
    public async Task<ActionResult<Category>> Create(Category category)
    {
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById),
            new { id = category.Id },
            category);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Category category)
    {
        if (id != category.Id)
        {
            return BadRequest();
        }
        _context.Entry(category).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound();
        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

