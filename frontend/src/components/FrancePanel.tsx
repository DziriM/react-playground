// frontend/src/components/FrancePanel.tsx
import { useQuery } from "@tanstack/react-query";
import type { JSX } from "react";

type RestCountryName = { common?: string; official?: string };
type RestCountryCurrency = { name?: string; symbol?: string };
type RestCountryV3 = {
  name?: RestCountryName;
  population?: number;
  area?: number;
  capital?: string[] | string;
  currencies?: Record<string, RestCountryCurrency>;
};

type EurUsdResult = { rate: number | null; date: string | null };
type CoinGeckoResult = { btcUsd: number | null; updatedAt?: string | null };

type CountryInfo = {
  name: string;
  population?: number | null;
  area?: number | null;
  capital?: string | null;
  currencies?: string | null; // "EUR (Euro)"
};

async function fetchEurUsd(): Promise<EurUsdResult> {
  try {
    const r = await fetch(
      "/api/proxy/eurusd" /* optional if you added a direct proxy; fallback below */
    );
    // If you don't have /api/proxy/eurusd, fallback to frankfurter directly:
    // const r = await fetch('https://api.frankfurter.app/latest?base=EUR&symbols=USD');
    if (!r.ok) throw new Error("frankfurter proxy error: " + r.status);
    const json: any = await r.json();
    return {
      rate: json?.rates?.USD ?? json?.rates?.usd ?? null,
      date: json?.date ?? null,
    };
  } catch (e) {
    // Fallback to direct public API if proxy not available
    try {
      const r2 = await fetch(
        "https://api.frankfurter.app/latest?base=EUR&symbols=USD"
      );
      if (!r2.ok) throw new Error("frankfurter direct error: " + r2.status);
      const json2: any = await r2.json();
      return {
        rate: json2?.rates?.USD ?? json2?.rates?.usd ?? null,
        date: json2?.date ?? null,
      };
    } catch (err) {
      console.warn("fetchEurUsd failed", e, err);
      return { rate: null, date: null };
    }
  }
}

async function fetchBtc(): Promise<CoinGeckoResult> {
  try {
    // Use backend proxy to avoid CORS if present
    const r = await fetch("/api/proxy/btc");
    if (!r.ok) throw new Error("proxy coingecko error: " + r.status);
    const json: any = await r.json();
    const price = json?.bitcoin?.usd ?? null;
    return { btcUsd: price, updatedAt: new Date().toISOString() };
  } catch (e) {
    // fallback to direct (may hit CORS in browser)
    try {
      const r2 = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      );
      if (!r2.ok) throw new Error("direct coingecko error: " + r2.status);
      const json2: any = await r2.json();
      const price2 = json2?.bitcoin?.usd ?? null;
      return { btcUsd: price2, updatedAt: new Date().toISOString() };
    } catch (err) {
      console.warn("fetchBtc failed", e, err);
      return { btcUsd: null };
    }
  }
}

async function fetchFranceInfo(): Promise<CountryInfo> {
  try {
    // prefer proxy to avoid CORS
    const r = await fetch("/api/proxy/france");
    if (!r.ok) throw new Error("proxy restcountries error: " + r.status);
    const json: RestCountryV3[] = await r.json();

    const first: RestCountryV3 =
      Array.isArray(json) && json.length > 0
        ? json[0]
        : (json as RestCountryV3);

    const name = first?.name?.common ?? first?.name?.official ?? "France";
    const population = first?.population ?? null;
    const area = first?.area ?? null;
    const capital =
      Array.isArray(first?.capital) && first?.capital.length > 0
        ? String(first.capital[0])
        : first?.capital
        ? String(first.capital)
        : null;

    let currencies: string | null = null;
    if (first?.currencies && typeof first.currencies === "object") {
      const entries = Object.entries(first.currencies);
      if (entries.length > 0) {
        const [code, info] = entries[0];
        const label = info?.name ?? "";
        currencies = `${code}${label ? ` (${label})` : ""}`;
      }
    }

    return { name, population, area, capital, currencies };
  } catch (e) {
    console.warn("fetchFranceInfo failed", e);
    return { name: "France" };
  }
}

export default function FrancePanel(): JSX.Element {
  const { data: eur } = useQuery<EurUsdResult, Error>({
    queryKey: ["eur-usd"],
    queryFn: fetchEurUsd,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: btc } = useQuery<CoinGeckoResult, Error>({
    queryKey: ["btc-usd"],
    queryFn: fetchBtc,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const { data: france } = useQuery<CountryInfo, Error>({
    queryKey: ["france-info"],
    queryFn: fetchFranceInfo,
    refetchInterval: 24 * 60 * 60 * 1000,
    staleTime: 24 * 60 * 60 * 1000,
  });

  return (
    <div className="panel card" style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>France — quick data</h3>
        <small style={{ color: "#bbb" }}>public APIs</small>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="stat-row">
          <div className="stat-label">EUR → USD</div>
          <div className="stat-value">
            {eur?.rate ? eur.rate.toFixed(4) : "n/a"}
          </div>
        </div>
        <div className="stat-row">
          <div className="stat-label">Cours mis à jour</div>
          <div className="stat-value">{eur?.date ?? "—"}</div>
        </div>

        <div style={{ height: 8 }} />
        <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>
          Crypto (CoinGecko)
        </div>
        <div className="stat-row">
          <div className="stat-label">Bitcoin (BTC) — USD</div>
          <div className="stat-value">
            {btc?.btcUsd ? `$ ${btc.btcUsd.toLocaleString()}` : "n/a"}
          </div>
        </div>
        <div className="stat-row">
          <div className="stat-label">Dernière mise à jour</div>
          <div className="stat-value">
            {btc?.updatedAt
              ? new Date(btc.updatedAt).toLocaleTimeString()
              : "—"}
          </div>
        </div>

        <div style={{ height: 8 }} />
        <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>
          France basics (RestCountries)
        </div>
        <div className="stat-row">
          <div className="stat-label">Population</div>
          <div className="stat-value">
            {france?.population ? france.population.toLocaleString() : "n/a"}
          </div>
        </div>
        <div className="stat-row">
          <div className="stat-label">Superficie (km²)</div>
          <div className="stat-value">
            {france?.area ? france.area.toLocaleString() : "n/a"}
          </div>
        </div>
        <div className="stat-row">
          <div className="stat-label">Capitale</div>
          <div className="stat-value">{france?.capital ?? "n/a"}</div>
        </div>
        <div className="stat-row">
          <div className="stat-label">Devise</div>
          <div className="stat-value">{france?.currencies ?? "EUR"}</div>
        </div>

        <div style={{ marginTop: 10, color: "#999", fontSize: 12 }}>
          Remarque : si un fetch public échoue (CORS / indisponibilité), des
          placeholders s’afficheront automatiquement.
        </div>
      </div>
    </div>
  );
}
