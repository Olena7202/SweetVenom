using System;
using System.Collections.Generic;

namespace sweetVenomServer.Models;

public partial class Cake
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal BasePrice { get; set; }

    public string? PhotoUrl { get; set; }

    public int? CategoryId { get; set; }
    public string? Weight { get; set; }

    public bool? IsCustomizable { get; set; }
    public string? Ingredients { get; set; }

    public bool? IsAvailable { get; set; }

    public virtual Category? Category { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
