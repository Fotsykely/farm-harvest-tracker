using System.ComponentModel.DataAnnotations;
using Api.Entities;

namespace Api.Dtos;

// Request body for PUT: the three quantities of an existing entry. The plot and the month of an entry
// never change: to move an entry, delete it and create another one.
// The validation attributes are picked up automatically by [ApiController]:
// invalid input returns a 400 with one message list per field.
public class UpdateHarvestRequestDto
{
    [Required(ErrorMessage = "La quantité de riz est obligatoire.")]
    [Range(0d, Harvest.MaxKg, ErrorMessage = "La quantité de riz doit être comprise entre {1} et {2} kg.")]
    public decimal? RiceKg { get; set; }

    [Required(ErrorMessage = "La quantité de maïs est obligatoire.")]
    [Range(0d, Harvest.MaxKg, ErrorMessage = "La quantité de maïs doit être comprise entre {1} et {2} kg.")]
    public decimal? MaizeKg { get; set; }

    [Required(ErrorMessage = "La quantité de manioc est obligatoire.")]
    [Range(0d, Harvest.MaxKg, ErrorMessage = "La quantité de manioc doit être comprise entre {1} et {2} kg.")]
    public decimal? CassavaKg { get; set; }
}

// Request body for POST: the plot and the month, plus the quantities.
public class CreateHarvestRequestDto : UpdateHarvestRequestDto
{
    [Range(1, int.MaxValue, ErrorMessage = "La parcelle est obligatoire.")]
    public int PlotId { get; set; }

    [Range(Harvest.MinYear, Harvest.MaxYear, ErrorMessage = "L'année doit être comprise entre {1} et {2}.")]
    public int Year { get; set; }

    [Range(1, 12, ErrorMessage = "Le mois doit être compris entre {1} et {2}.")]
    public int Month { get; set; }
}

// Response for a single entry, also used for the list. TotalKg is computed by the API.
public record HarvestDto(
    int Id,
    int PlotId,
    string PlotName,
    int Year,
    int Month,
    decimal RiceKg,
    decimal MaizeKg,
    decimal CassavaKg,
    decimal TotalKg,
    DateTime CreatedAt);
