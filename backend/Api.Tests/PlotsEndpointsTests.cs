using System.Net.Http.Json;
using Api.Dtos;

namespace Api.Tests;

[Collection(ApiCollection.Name)]
public class PlotsEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task The_six_plots_of_the_cooperative_are_listed_in_order()
    {
        var plots = await factory.CreateClient().GetFromJsonAsync<List<PlotDto>>("/api/plots");

        Assert.Equal(
            ["Parcelle Nord", "Parcelle Sud", "Verger", "Potager", "Colline", "Bas-fond"],
            plots!.Select(p => p.Name));
    }
}
