namespace Api.Entities;

// One monthly entry: the quantities (kg) harvested on one plot during one month.
// A plot has at most one entry per month (unique index, see AppDbContext).
public class Harvest
{
    // These limits are shared by the database schema and the request validation.
    public const int MinYear = 2000;
    public const int MaxYear = 2100;
    public const double MaxKg = 9_999_999.99;

    public int Id { get; set; }
    public int PlotId { get; set; }
    public Plot Plot { get; set; } = null!;
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal RiceKg { get; set; }
    public decimal MaizeKg { get; set; }
    public decimal CassavaKg { get; set; }

    // Filled in by the database on insert: see AppDbContext.
    public DateTime CreatedAt { get; set; }
}
