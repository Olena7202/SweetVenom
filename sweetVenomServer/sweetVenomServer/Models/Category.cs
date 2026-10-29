using System;
using System.Collections.Generic;

namespace sweetVenomServer.Models;

public partial class Category
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Cake> Cakes { get; set; } = new List<Cake>();
}
