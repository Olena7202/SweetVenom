using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using sweetVenomServer.Data;
using sweetVenomServer.Models;

[Route("api/[controller]")]
[ApiController]
public class OrdersController : ControllerBase
{
    public readonly CakeShopContext _context;

    public OrdersController(CakeShopContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetAll()
    {
        return await _context.Orders
            .Include(o => o.Client)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Cake)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Biscuit)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Cream)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Order>> GetById(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Client)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Cake)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Biscuit)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Cream)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();
        return order;
    }

    [HttpGet("client/{clientId}")]
    public async Task<ActionResult<IEnumerable<Order>>> GetByClient(int clientId)
    {
        return await _context.Orders
            .Where(o => o.ClientId == clientId)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Cake)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Order>> Create(Order order)
    {
        order.CreatedAt = DateTime.UtcNow;
        order.Status = "Pending";
        order.PaymentStatus = "Unpaid";
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound();
        order.Status = status;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound();
        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();
        return NoContent();
    }

}
