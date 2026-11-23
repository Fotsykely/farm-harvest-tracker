using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Api.Dtos;

namespace Api.Tests;

// The database is shared by every test of the run: each test uses its own year so that the entries
// of one test never collide with (or show up in the lists of) another one.
[Collection(ApiCollection.Name)]
public class HarvestsEndpointsTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Created_entry_can_be_read_back_with_its_plot_name_and_total()
    {
        var created = await CreateAsync(plotId: 3, year: 2031, month: 4, rice: 120.5m, maize: 80, cassava: 10.25m);

        var response = await _client.GetAsync($"/api/harvests/{created.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var harvest = await response.Content.ReadFromJsonAsync<HarvestDto>();
        Assert.Equal("Verger", harvest!.PlotName);
        Assert.Equal(120.5m, harvest.RiceKg);
        Assert.Equal(210.75m, harvest.TotalKg);
    }

    [Fact]
    public async Task Creating_a_second_entry_for_the_same_plot_and_month_answers_409()
    {
        await CreateAsync(plotId: 1, year: 2032, month: 6);

        var response = await _client.PostAsJsonAsync("/api/harvests", NewEntry(1, 2032, 6));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task The_same_plot_can_have_an_entry_in_another_month_and_another_plot_in_the_same_month()
    {
        await CreateAsync(plotId: 1, year: 2033, month: 1);

        await CreateAsync(plotId: 1, year: 2033, month: 2);
        await CreateAsync(plotId: 2, year: 2033, month: 1);
    }

    [Fact]
    public async Task Creating_an_entry_with_invalid_values_answers_400_with_a_message_per_field()
    {
        var response = await _client.PostAsJsonAsync("/api/harvests",
            new { plotId = 1, year = 2034, month = 13, riceKg = -5, maizeKg = 10 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.True(errors.TryGetProperty("Month", out _));
        Assert.True(errors.TryGetProperty("RiceKg", out _));
        Assert.True(errors.TryGetProperty("CassavaKg", out _)); // missing quantity
    }

    [Fact]
    public async Task Creating_an_entry_for_an_unknown_plot_answers_400_on_the_plot_field()
    {
        var response = await _client.PostAsJsonAsync("/api/harvests", NewEntry(plotId: 999, year: 2035, month: 1));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.True(errors.TryGetProperty("PlotId", out _));
    }

    [Fact]
    public async Task Zero_is_a_valid_quantity()
    {
        var created = await CreateAsync(plotId: 4, year: 2036, month: 7, rice: 0, maize: 0, cassava: 0);

        Assert.Equal(0m, created.TotalKg);
    }

    [Fact]
    public async Task List_can_be_filtered_by_year_and_month_and_is_sorted_by_plot()
    {
        await CreateAsync(plotId: 5, year: 2037, month: 3);
        await CreateAsync(plotId: 2, year: 2037, month: 3);
        await CreateAsync(plotId: 2, year: 2037, month: 4);

        var march = await _client.GetFromJsonAsync<List<HarvestDto>>("/api/harvests?year=2037&month=3");
        var year = await _client.GetFromJsonAsync<List<HarvestDto>>("/api/harvests?year=2037");

        Assert.Equal([2, 5], march!.Select(h => h.PlotId));
        Assert.Equal(3, year!.Count);
        Assert.Equal(4, year[0].Month); // most recent month first
    }

    [Fact]
    public async Task Updated_entry_keeps_its_new_quantities_and_its_plot_and_month()
    {
        var created = await CreateAsync(plotId: 6, year: 2038, month: 9, rice: 1, maize: 1, cassava: 1);

        var response = await _client.PutAsJsonAsync($"/api/harvests/{created.Id}",
            new { riceKg = 50, maizeKg = 60, cassavaKg = 70 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var harvest = await response.Content.ReadFromJsonAsync<HarvestDto>();
        Assert.Equal(180m, harvest!.TotalKg);
        Assert.Equal((6, 2038, 9), (harvest.PlotId, harvest.Year, harvest.Month));
    }

    [Fact]
    public async Task Updating_with_a_negative_quantity_answers_400_and_an_unknown_entry_answers_404()
    {
        var created = await CreateAsync(plotId: 1, year: 2039, month: 1);

        var invalid = await _client.PutAsJsonAsync($"/api/harvests/{created.Id}",
            new { riceKg = -1, maizeKg = 0, cassavaKg = 0 });
        var unknown = await _client.PutAsJsonAsync("/api/harvests/999999",
            new { riceKg = 1, maizeKg = 1, cassavaKg = 1 });

        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
    }

    [Fact]
    public async Task Reading_an_unknown_entry_answers_404()
    {
        var response = await _client.GetAsync("/api/harvests/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Deleting_an_entry_answers_204_then_404_and_frees_the_month()
    {
        var created = await CreateAsync(plotId: 3, year: 2040, month: 11);

        var first = await _client.DeleteAsync($"/api/harvests/{created.Id}");
        var second = await _client.DeleteAsync($"/api/harvests/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, second.StatusCode);
        await CreateAsync(plotId: 3, year: 2040, month: 11); // the plot can be entered again
    }

    private static object NewEntry(int plotId, int year, int month, decimal rice = 10, decimal maize = 20, decimal cassava = 30) =>
        new { plotId, year, month, riceKg = rice, maizeKg = maize, cassavaKg = cassava };

    private async Task<HarvestDto> CreateAsync(
        int plotId, int year, int month, decimal rice = 10, decimal maize = 20, decimal cassava = 30)
    {
        var response = await _client.PostAsJsonAsync("/api/harvests", NewEntry(plotId, year, month, rice, maize, cassava));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<HarvestDto>())!;
    }
}
