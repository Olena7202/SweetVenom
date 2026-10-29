using System.ComponentModel.DataAnnotations;

public class UpdateProfileDto
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = "";
    [Required, EmailAddress, StringLength(100)]
    public string Email { get; set; } = "";
    [Required, StringLength(25)]
    public string Phone { get; set; } = "";
}

