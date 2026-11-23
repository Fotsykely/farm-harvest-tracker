using System.ComponentModel.DataAnnotations;
using Api.Entities;

namespace Api.Dtos;

// Query string of GET /api/results: the month to total up. Both values are required
// (a missing one stays at 0 and fails the range, so the 400 names the field).
public class ResultQueryDto
{
    [Range(Harvest.MinYear, Harvest.MaxYear, ErrorMessage = "L'année doit être comprise entre {1} et {2}.")]
    public int Year { get; set; }

    [Range(1, 12, ErrorMessage = "Le mois doit être compris entre {1} et {2}.")]
    public int Month { get; set; }
}

// One row of the result: a plot and its three quantities for the month. A plot without entry
// is still returned, with zeros and HasEntry = false.
public record PlotResultDto(
    int PlotId,
    string PlotName,
    decimal RiceKg,
    decimal MaizeKg,
    decimal CassavaKg,
    decimal TotalKg,
    bool HasEntry);
