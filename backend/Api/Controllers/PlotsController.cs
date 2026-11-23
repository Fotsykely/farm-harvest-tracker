using Api.Data;
using Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

// The plots are fixed (see AppDbContext): read-only.
[ApiController]
[Route("api/plots")]
public class PlotsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PlotDto>>> GetAll(CancellationToken cancellationToken)
    {
        return await db.Plots
            .OrderBy(p => p.Id)
            .Select(p => new PlotDto(p.Id, p.Name))
            .ToListAsync(cancellationToken);
    }
}
