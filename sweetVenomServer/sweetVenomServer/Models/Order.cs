using System;
using System.Collections.Generic;

namespace sweetVenomServer.Models;

public partial class Order
{
    public int Id { get; set; }

    public int? ClientId { get; set; }

    public string? Note { get; set; }

    public decimal TotalPrice { get; set; }

    public string? Status { get; set; }

    public string? PaymentStatus { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? DeliveryDate { get; set; }

    public virtual User? Client { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
