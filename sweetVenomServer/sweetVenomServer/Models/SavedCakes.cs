using sweetVenomServer.Models;

public class SavedCake
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public User Client { get; set; }
    public int CakeId { get; set; }
    public Cake Cake { get; set; }
    public DateTime SavedAt { get; set; }
}