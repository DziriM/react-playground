// backend/Program.cs
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyHeader().AllowAnyMethod().AllowCredentials().SetIsOriginAllowed(_ => true)
    );
});

// Register in-memory stats service and hosted broadcaster
builder.Services.AddSingleton<StatsService>();
builder.Services.AddHostedService<PeriodicBroadcastService>();

var app = builder.Build();
app.UseCors();

app.MapGet("/api/stats", (StatsService stats) => Results.Ok(stats.GetStats()));

// Proxy for CoinGecko BTC price
app.MapGet(
    "/api/proxy/btc",
    async (IServiceProvider sp) =>
    {
        var factory = sp.GetRequiredService<IHttpClientFactory>();
        var client = factory.CreateClient();
        var resp = await client.GetAsync(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
        );
        resp.EnsureSuccessStatusCode();
        var content = await resp.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json");
    }
);

// Proxy for RestCountries (France)
app.MapGet(
    "/api/proxy/france",
    async (IServiceProvider sp) =>
    {
        var factory = sp.GetRequiredService<IHttpClientFactory>();
        var client = factory.CreateClient();
        var resp = await client.GetAsync("https://restcountries.com/v3.1/alpha/fr");
        resp.EnsureSuccessStatusCode();
        var content = await resp.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json");
    }
);

app.MapHub<StreamHub>("/hub/stream");

app.Run();

// --- Hub ---
public class StreamHub : Hub
{
    // Hub remains lightweight; messages are pushed from the PeriodicBroadcastService
}

// --- Stats model & service ---
public record StatsDto(int TotalMessages, int ActiveUsers, double ThroughputPerMin);

public class StatsService
{
    private int _totalMessages = 0;
    private int _activeUsers = 5; // initial guess
    private readonly object _lock = new();

    public StatsDto GetStats()
    {
        lock (_lock)
        {
            return new StatsDto(_totalMessages, _activeUsers, ComputeThroughputPerMin());
        }
    }

    public void IncrementMessages(int delta = 1)
    {
        lock (_lock)
        {
            _totalMessages += delta;
        }
    }

    public void RandomlyAdjustUsers(int delta)
    {
        lock (_lock)
        {
            _activeUsers = Math.Max(1, _activeUsers + delta);
        }
    }

    private double ComputeThroughputPerMin()
    {
        // simple derived metric: messages per minute (arbitrary formula for demo)
        return Math.Round(_totalMessages / 1.0, 2); // keep simple
    }
}

// --- Background broadcaster ---
public class PeriodicBroadcastService : BackgroundService
{
    private readonly IHubContext<StreamHub> _hub;
    private readonly StatsService _stats;
    private readonly Random _rnd = new();

    public PeriodicBroadcastService(IHubContext<StreamHub> hub, StatsService stats)
    {
        _hub = hub;
        _stats = stats;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // simulate events
            int addedMessages = _rnd.Next(1, 4);
            _stats.IncrementMessages(addedMessages);

            // randomly change active users a bit
            int userDelta = _rnd.Next(-1, 2); // -1,0,1
            _stats.RandomlyAdjustUsers(userDelta);

            // Broadcast simple message stream (existing demo)
            var counterMsg = new
            {
                id = Guid.NewGuid().ToString(),
                text = $"Broadcast {DateTime.UtcNow:HH:mm:ss}"
            };
            await _hub.Clients.All.SendAsync("ReceiveMessage", counterMsg, stoppingToken);

            // Broadcast stats update
            var statsDto = _stats.GetStats();
            await _hub.Clients.All.SendAsync("StatsUpdate", statsDto, stoppingToken);

            await Task.Delay(TimeSpan.FromSeconds(2.5), stoppingToken);
        }
    }
}
