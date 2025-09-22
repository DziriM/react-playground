using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyHeader().AllowAnyMethod().AllowCredentials().SetIsOriginAllowed(_ => true));
});
builder.Services.AddSingleton<PeriodicBroadcastService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<PeriodicBroadcastService>());

var app = builder.Build();

app.UseCors();

app.MapGet("/api/items", () => Results.Ok(new[] { new { id = 1, name = "Item A" }, new { id = 2, name = "Item B" } }));

app.MapHub<StreamHub>("/hub/stream");

app.Run();

public class StreamHub : Hub
{
    // nothing required here for the demo
}

public class PeriodicBroadcastService : BackgroundService
{
    private readonly IHubContext<StreamHub> _hub;
    private int _counter = 0;

    public PeriodicBroadcastService(IHubContext<StreamHub> hub)
    {
        _hub = hub;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _counter++;
            await _hub.Clients.All.SendAsync("ReceiveMessage", new { id = _counter, text = $"Message #{_counter} from server" }, cancellationToken: stoppingToken);
            await Task.Delay(TimeSpan.FromSeconds(2.5), stoppingToken);
        }
    }
}
