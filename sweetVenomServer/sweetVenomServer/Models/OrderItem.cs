using System;
using System.Collections.Generic;

namespace sweetVenomServer.Models;

public partial class OrderItem
{
    public int Id { get; set; }

    public int? OrderId { get; set; }

    public int? CakeId { get; set; }

    public int? BiscuitId { get; set; }

    public int? CreamId { get; set; }

    public int Quantity { get; set; }

    public decimal ItemPrice { get; set; }

    public virtual Biscuit? Biscuit { get; set; }

    public virtual Cake? Cake { get; set; }

    public virtual Cream? Cream { get; set; }

    public virtual Order? Order { get; set; }
}
