namespace Api.Entities;

// A field of the cooperative. The six plots are fixed: they are inserted by the migration (see AppDbContext).
public class Plot
{
    public const int NameMaxLength = 50;

    public int Id { get; set; }
    public required string Name { get; set; }
}
