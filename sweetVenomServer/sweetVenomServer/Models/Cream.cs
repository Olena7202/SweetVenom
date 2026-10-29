using System;
using System.Collections.Generic;

namespace sweetVenomServer.Models;

public partial class Cream
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public decimal ExtraPrice { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
