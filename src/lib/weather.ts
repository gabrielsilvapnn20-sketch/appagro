// Clima por localização — Open-Meteo (gratuito, sem chave de API).
// Chamado no navegador quando um cliente/talhão tem lat/lng salvos.
// Foco no que interessa ao RTV: janela de pulverização (vento + chuva) e
// previsão dos próximos dias.

export type WeatherNow = {
  temp: number;
  vento: number; // km/h
  rajada: number; // km/h
  umidade: number; // %
  precip: number; // mm na hora
  code: number;
};

export type WeatherDay = {
  data: string; // YYYY-MM-DD
  tmax: number;
  tmin: number;
  chuvaMm: number;
  chuvaProb: number; // %
  ventoMax: number; // km/h
  code: number;
};

export type Weather = {
  now: WeatherNow;
  dias: WeatherDay[];
};

// Códigos WMO -> rótulo pt-BR + emoji. Tabela do Open-Meteo.
const WMO: Record<number, { label: string; emoji: string }> = {
  0: { label: "Céu limpo", emoji: "☀️" },
  1: { label: "Predomínio de sol", emoji: "🌤️" },
  2: { label: "Parcialmente nublado", emoji: "⛅" },
  3: { label: "Nublado", emoji: "☁️" },
  45: { label: "Névoa", emoji: "🌫️" },
  48: { label: "Névoa com geada", emoji: "🌫️" },
  51: { label: "Garoa fraca", emoji: "🌦️" },
  53: { label: "Garoa", emoji: "🌦️" },
  55: { label: "Garoa forte", emoji: "🌧️" },
  61: { label: "Chuva fraca", emoji: "🌦️" },
  63: { label: "Chuva", emoji: "🌧️" },
  65: { label: "Chuva forte", emoji: "🌧️" },
  66: { label: "Chuva congelante", emoji: "🌧️" },
  67: { label: "Chuva congelante forte", emoji: "🌧️" },
  71: { label: "Neve fraca", emoji: "🌨️" },
  73: { label: "Neve", emoji: "🌨️" },
  75: { label: "Neve forte", emoji: "❄️" },
  80: { label: "Pancadas isoladas", emoji: "🌦️" },
  81: { label: "Pancadas de chuva", emoji: "🌧️" },
  82: { label: "Pancadas fortes", emoji: "⛈️" },
  95: { label: "Tempestade", emoji: "⛈️" },
  96: { label: "Tempestade com granizo", emoji: "⛈️" },
  99: { label: "Tempestade forte com granizo", emoji: "⛈️" },
};

export function weatherLabel(code: number): { label: string; emoji: string } {
  return WMO[code] || { label: "—", emoji: "🌡️" };
}

export function diaCurto(data: string): string {
  // data = YYYY-MM-DD -> "seg 28/09"
  const [y, m, d] = data.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  return `${dias[dt.getDay()]} ${String(d).padStart(2, "0")}/${String(
    m
  ).padStart(2, "0")}`;
}

// Recomendação simples de janela de pulverização.
export type SprayAdvice = { nivel: "boa" | "atencao" | "ruim"; texto: string };

export function sprayAdvice(now: WeatherNow, hoje?: WeatherDay): SprayAdvice {
  if (now.precip > 0.2 || (hoje && hoje.chuvaProb >= 60)) {
    return {
      nivel: "ruim",
      texto: "Chuva prevista — risco de lavagem do produto. Evite pulverizar.",
    };
  }
  if (now.vento >= 15 || now.rajada >= 25) {
    return {
      nivel: "ruim",
      texto: `Vento forte (${Math.round(
        now.vento
      )} km/h) — alta deriva. Aguarde acalmar.`,
    };
  }
  if (now.vento < 3) {
    return {
      nivel: "atencao",
      texto: "Vento muito fraco — risco de inversão térmica e deriva. Prefira 3–10 km/h.",
    };
  }
  if (now.vento >= 10) {
    return {
      nivel: "atencao",
      texto: `Vento moderado (${Math.round(
        now.vento
      )} km/h) — atenção à deriva em produtos voláteis.`,
    };
  }
  return {
    nivel: "boa",
    texto: `Boa janela: vento ${Math.round(
      now.vento
    )} km/h e sem chuva próxima.`,
  };
}

export async function fetchWeather(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: "auto",
    current:
      "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
    forecast_days: "5",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { signal }
  );
  if (!res.ok) throw new Error("weather_http_" + res.status);
  const j = await res.json();
  const c = j.current || {};
  const d = j.daily || {};
  const dias: WeatherDay[] = (d.time || []).map((t: string, i: number) => ({
    data: t,
    tmax: Math.round(d.temperature_2m_max?.[i] ?? 0),
    tmin: Math.round(d.temperature_2m_min?.[i] ?? 0),
    chuvaMm: Math.round((d.precipitation_sum?.[i] ?? 0) * 10) / 10,
    chuvaProb: Math.round(d.precipitation_probability_max?.[i] ?? 0),
    ventoMax: Math.round(d.wind_speed_10m_max?.[i] ?? 0),
    code: d.weather_code?.[i] ?? 0,
  }));
  return {
    now: {
      temp: Math.round(c.temperature_2m ?? 0),
      vento: Math.round(c.wind_speed_10m ?? 0),
      rajada: Math.round(c.wind_gusts_10m ?? 0),
      umidade: Math.round(c.relative_humidity_2m ?? 0),
      precip: c.precipitation ?? 0,
      code: c.weather_code ?? 0,
    },
    dias,
  };
}
