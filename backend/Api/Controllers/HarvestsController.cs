using Api.Data;
using Api.Dtos;
using Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/harvests")]
public class HarvestsController(AppDbContext db) : ControllerBase
{
    // Filters are optional: GET /api/harvests?year=2026&month=3 lists the entries of March 2026.
    [HttpGet]
    public async Task<ActionResult<List<HarvestDto>>> GetAll(
        [FromQuery] int? year, [FromQuery] int? month, [FromQuery] int? plotId, CancellationToken cancellationToken)
    {
        var harvests = db.Harvests.AsQueryable();
        if (year is not null) harvests = harvests.Where(h => h.Year == year);
        if (month is not null) harvests = harvests.Where(h => h.Month == month);
        if (plotId is not null) harvests = harvests.Where(h => h.PlotId == plotId);

        // Sorted before the projection: EF cannot translate an ordering on the DTO.
        var sorted = harvests
            .OrderByDescending(h => h.Year)
            .ThenByDescending(h => h.Month)
            .ThenBy(h => h.PlotId);

        return await ToDtos(sorted).ToListAsync(cancellationToken);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<HarvestDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var harvest = await ToDtos(db.Harvests.Where(h => h.Id == id)).FirstOrDefaultAsync(cancellationToken);
        return harvest is null ? NotFound() : harvest;
    }

    [HttpPost]
    public async Task<ActionResult<HarvestDto>> Create(CreateHarvestRequestDto request, CancellationToken cancellationToken)
    {
        if (!await db.Plots.AnyAsync(p => p.Id == request.PlotId, cancellationToken))
        {
            ModelState.AddModelError(nameof(request.PlotId), "Cette parcelle n'existe pas.");
            return ValidationProblem(ModelState);
        }

        var alreadyEntered = await db.Harvests.AnyAsync(
            h => h.PlotId == request.PlotId && h.Year == request.Year && h.Month == request.Month, cancellationToken);
        if (alreadyEntered)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Saisie déjà existante",
                Detail = "Une saisie existe déjà pour cette parcelle et ce mois : modifiez-la plutôt que d'en créer une autre.",
            });
        }

        var harvest = new Harvest
        {
            PlotId = request.PlotId,
            Year = request.Year,
            Month = request.Month,
            RiceKg = request.RiceKg!.Value,
            MaizeKg = request.MaizeKg!.Value,
            CassavaKg = request.CassavaKg!.Value,
        };
        db.Harvests.Add(harvest);
        await db.SaveChangesAsync(cancellationToken);

        var dto = await ToDtos(db.Harvests.Where(h => h.Id == harvest.Id)).SingleAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = harvest.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<HarvestDto>> Update(int id, UpdateHarvestRequestDto request, CancellationToken cancellationToken)
    {
        var harvest = await db.Harvests.FindAsync([id], cancellationToken);
        if (harvest is null)
            return NotFound();

        harvest.RiceKg = request.RiceKg!.Value;
        harvest.MaizeKg = request.MaizeKg!.Value;
        harvest.CassavaKg = request.CassavaKg!.Value;
        await db.SaveChangesAsync(cancellationToken);

        return await ToDtos(db.Harvests.Where(h => h.Id == id)).SingleAsync(cancellationToken);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var deletedRows = await db.Harvests.Where(h => h.Id == id).ExecuteDeleteAsync(cancellationToken);
        return deletedRows == 0 ? NotFound() : NoContent();
    }

    // The projection is translated to SQL: the plot name and the total come from the same query.
    private static IQueryable<HarvestDto> ToDtos(IQueryable<Harvest> harvests) =>
        harvests.Select(h => new HarvestDto(
            h.Id, h.PlotId, h.Plot.Name, h.Year, h.Month,
            h.RiceKg, h.MaizeKg, h.CassavaKg, h.RiceKg + h.MaizeKg + h.CassavaKg, h.CreatedAt));
}
