using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Api.Dtos;

namespace Api.Tests;

// Same rule as the other tests: each test uses its own year (here 2050 and after).
[Collection(ApiCollection.Name)]
public class ResultsEndpointsTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Result_lists_the_six_plots_sorted_by_decreasing_total()
    {
        await CreateAsync(plotId: 1, year: 2050, month: 5, rice: 100, maize: 0, cassava: 0);    // 100
        await CreateAsync(plotId: 3, year: 2050, month: 5, rice: 10, maize: 20, cassava: 400);  // 430
        await CreateAsync(plotId: 5, year: 2050, month: 5, rice: 50, maize: 50.5m, cassava: 50); // 150.5

        var results = await GetResultAsync(2050, 5);

        Assert.Equal(["Verger", "Colline", "Parcelle Nord"], results.Take(3).Select(r => r.PlotName));
        Assert.Equal([430m, 150.5m, 100m], results.Take(3).Select(r => r.TotalKg));
        Assert.Equal(6, results.Count);
    }

    [Fact]
    public async Task Result_carries_the_three_crops_of_each_plot()
    {
        await CreateAsync(plotId: 2, year: 2051, month: 1, rice: 12.5m, maize: 7, cassava: 30);

        var results = await GetResultAsync(2051, 1);

        var plot = Assert.Single(results, r => r.PlotId == 2);
        Assert.Equal((12.5m, 7m, 30m, 49.5m), (plot.RiceKg, plot.MaizeKg, plot.CassavaKg, plot.TotalKg));
        Assert.True(plot.HasEntry);
    }

    [Fact]
    public async Task Plots_without_entry_come_last_with_zeros_in_the_order_of_the_plot_list()
    {
        await CreateAsync(plotId: 6, year: 2052, month: 8, rice: 1, maize: 1, cassava: 1);

        var results = await GetResultAsync(2052, 8);

        Assert.Equal("Bas-fond", results[0].PlotName);
        var withoutEntry = results.Skip(1).ToList();
        Assert.Equal(["Parcelle Nord", "Parcelle Sud", "Verger", "Potager", "Colline"], withoutEntry.Select(r => r.PlotName));
        Assert.All(withoutEntry, r =>
        {
            Assert.Equal((0m, 0m, 0m, 0m), (r.RiceKg, r.MaizeKg, r.CassavaKg, r.TotalKg));
            Assert.False(r.HasEntry);
        });
    }

    [Fact]
    public async Task A_month_without_any_entry_still_lists_the_six_plots_with_zeros()
    {
        var results = await GetResultAsync(2053, 2);

        Assert.Equal(6, results.Count);
        Assert.All(results, r => Assert.Equal(0m, r.TotalKg));
    }

    [Fact]
    public async Task An_entry_of_zeros_comes_before_a_plot_without_entry()
    {
        await CreateAsync(plotId: 4, year: 2054, month: 12, rice: 0, maize: 0, cassava: 0);

        var results = await GetResultAsync(2054, 12);

        Assert.Equal(4, results[0].PlotId);
        Assert.True(results[0].HasEntry);
        Assert.All(results.Skip(1), r => Assert.False(r.HasEntry));
    }

    [Fact]
    public async Task Result_only_counts_the_requested_month()
    {
        await CreateAsync(plotId: 1, year: 2055, month: 3, rice: 999, maize: 0, cassava: 0);
        await CreateAsync(plotId: 2, year: 2055, month: 4, rice: 5, maize: 0, cassava: 0);

        var results = await GetResultAsync(2055, 4);

        Assert.Equal("Parcelle Sud", results[0].PlotName);
        Assert.Equal(0m, results.Single(r => r.PlotId == 1).TotalKg);
    }

    [Theory]
    [InlineData("", "Year")]
    [InlineData("?year=2026", "Month")]
    [InlineData("?year=2026&month=13", "Month")]
    [InlineData("?year=1999&month=5", "Year")]
    public async Task A_missing_or_invalid_period_answers_400_on_the_matching_field(string query, string field)
    {
        var response = await _client.GetAsync($"/api/results{query}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.True(errors.TryGetProperty(field, out _));
    }

    private async Task<List<PlotResultDto>> GetResultAsync(int year, int month) =>
        (await _client.GetFromJsonAsync<List<PlotResultDto>>($"/api/results?year={year}&month={month}"))!;

    private async Task CreateAsync(int plotId, int year, int month, decimal rice, decimal maize, decimal cassava)
    {
        var response = await _client.PostAsJsonAsync("/api/harvests",
            new { plotId, year, month, riceKg = rice, maizeKg = maize, cassavaKg = cassava });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
