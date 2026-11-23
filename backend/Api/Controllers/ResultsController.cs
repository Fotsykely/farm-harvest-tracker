using Api.Data;
using Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/results")]
public class ResultsController(AppDbContext db) : ControllerBase
{
    // GET /api/results?year=2026&month=3: every plot with its quantities of March 2026, biggest total first.
    // The calculation lives here, not in the front: the rule (zeros for a plot without entry, order of
    // the rows) is a business rule, and the tests of the API cover it.
    [HttpGet]
    public async Task<ActionResult<List<PlotResultDto>>> Get(
        [FromQuery] ResultQueryDto query, CancellationToken cancellationToken)
    {
        // At most one entry per plot and month (unique index): the dictionary key is the plot.
        var harvestsByPlot = await db.Harvests
            .Where(h => h.Year == query.Year && h.Month == query.Month)
            .ToDictionaryAsync(h => h.PlotId, cancellationToken);
        var plots = await db.Plots.OrderBy(p => p.Id).ToListAsync(cancellationToken);

        // Six plots: the join and the sort are done in memory, which keeps the rule readable.
        // A plot without entry gets zeros. When totals are equal (all the zeros), a plot that has an
        // entry comes before one that has none, then the order of the list of plots applies.
        return plots
            .Select(plot => harvestsByPlot.TryGetValue(plot.Id, out var harvest)
                ? new PlotResultDto(plot.Id, plot.Name, harvest.RiceKg, harvest.MaizeKg, harvest.CassavaKg,
                    harvest.RiceKg + harvest.MaizeKg + harvest.CassavaKg, HasEntry: true)
                : new PlotResultDto(plot.Id, plot.Name, 0, 0, 0, 0, HasEntry: false))
            .OrderByDescending(result => result.TotalKg)
            .ThenByDescending(result => result.HasEntry)
            .ThenBy(result => result.PlotId)
            .ToList();
    }
}
