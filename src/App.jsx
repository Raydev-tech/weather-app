
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  MapPin,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Sunrise,
  Sunset,
  CloudSun,
  LoaderCircle,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import "./App.css";

const DEFAULT_CITY = "Ibadan";

const weatherDescriptions = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"],
  48: ["Depositing rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Moderate drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  56: ["Light freezing drizzle", "🌧️"],
  57: ["Dense freezing drizzle", "🌧️"],
  61: ["Slight rain", "🌦️"],
  63: ["Moderate rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Light freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Slight snowfall", "🌨️"],
  73: ["Moderate snowfall", "🌨️"],
  75: ["Heavy snowfall", "❄️"],
  77: ["Snow grains", "🌨️"],
  80: ["Slight rain showers", "🌦️"],
  81: ["Moderate rain showers", "🌧️"],
  82: ["Violent rain showers", "⛈️"],
  85: ["Slight snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Thunderstorm with heavy hail", "⛈️"],
};

function describeWeather(code) {
  return weatherDescriptions[code] ?? ["Weather unavailable", "🌡️"];
}

function formatTime(value) {
  if (!value) return "--:--";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(value, index) {
  if (index === 0) return "Today";

  return new Date(`${value}T12:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "short" }
  );
}

function App() {
  const [cityInput, setCityInput] = useState("");
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const searchCity = useCallback(async (cityName) => {
    const query = cityName.trim();

    if (!query) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const geoUrl = new URL(
        "https://geocoding-api.open-meteo.com/v1/search"
      );

      geoUrl.search = new URLSearchParams({
        name: query,
        count: "1",
        language: "en",
        format: "json",
      }).toString();

      const geoResponse = await fetch(geoUrl);

      if (!geoResponse.ok) {
        throw new Error("Could not search for this city.");
      }

      const geoData = await geoResponse.json();
      const place = geoData.results?.[0];

      if (!place) {
        throw new Error(
          "City not found. Check the spelling and try again."
        );
      }

      const forecastUrl = new URL(
        "https://api.open-meteo.com/v1/forecast"
      );

      forecastUrl.search = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current:
          "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
        daily:
          "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
        timezone: "auto",
        forecast_days: "7",
      }).toString();

      const forecastResponse = await fetch(forecastUrl);

      if (!forecastResponse.ok) {
        throw new Error("Could not retrieve weather data.");
      }

      const forecastData = await forecastResponse.json();

      if (!forecastData.current || !forecastData.daily) {
        throw new Error("Weather data is incomplete. Try again.");
      }

      setLocation({
        name: place.name,
        region: place.admin1 || "",
        country: place.country || "",
      });

      setWeather(forecastData);
      setCityInput("");
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchCity(DEFAULT_CITY);
  }, [searchCity, refreshKey]);

  function handleSubmit(event) {
    event.preventDefault();
    searchCity(cityInput);
  }

  const current = weather?.current;
  const daily = weather?.daily;
  const [description, emoji] = describeWeather(
    current?.weather_code
  );

  const dateLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="SkyCast home">
          <span className="brand-icon">
            <CloudSun size={27} />
          </span>
          <span>SkyCast</span>
        </a>

        <div className="topbar-note">
          <span className="live-dot" />
          Weather Forecast
        </div>
      </header>

      <section className="intro">
        <p className="eyebrow">YOUR DAILY WEATHER COMPANION</p>
        <h1>
          Understand the sky.
          <br />
          <span>Plan your day.</span>
        </h1>
        <p className="intro-text">
          Get current weather conditions and a 7-day forecast
          for cities around the world.
        </p>
      </section>

      <form className="search-form" onSubmit={handleSubmit}>
        <Search size={21} aria-hidden="true" />
        <input
          value={cityInput}
          onChange={(event) => setCityInput(event.target.value)}
          placeholder="Search a city, e.g. Lagos"
          aria-label="Search city"
        />
        <button type="submit" disabled={loading}>
          {loading ? (
            <LoaderCircle className="spin" size={19} />
          ) : (
            "Search"
          )}
        </button>
      </form>

      {error && (
        <div className="error-message" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setError("");
              setRefreshKey((value) => value + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading && !weather && (
        <div className="loading-state">
          <LoaderCircle className="spin" size={30} />
          <p>Getting the latest weather...</p>
        </div>
      )}

      {weather && location && (
        <>
          <section className="weather-card">
            <div className="weather-card-top">
              <div>
                <p className="date-label">{dateLabel}</p>
                <h2 className="location-name">
                  <MapPin size={21} />
                  {location.name}
                </h2>
                <p className="location-region">
                  {[location.region, location.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              <button
                type="button"
                className="refresh-button"
                aria-label="Refresh weather"
                onClick={() =>
                  setRefreshKey((value) => value + 1)
                }
                disabled={loading}
              >
                <RefreshCw
                  size={18}
                  className={loading ? "spin" : ""}
                />
              </button>
            </div>

            <div className="main-weather">
              <div className="temperature-block">
                <span className="weather-emoji" role="img">
                  {emoji}
                </span>
                <div>
                  <p className="temperature">
                    {Math.round(current.temperature_2m)}
                    <span>°C</span>
                  </p>
                  <p className="condition">{description}</p>
                </div>
              </div>

              <div className="feels-like">
                <Thermometer size={18} />
                Feels like{" "}
                {Math.round(current.apparent_temperature)}°C
              </div>
            </div>

            <div className="weather-divider" />

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-icon">
                  <Droplets size={21} />
                </span>
                <div>
                  <p>Humidity</p>
                  <strong>
                    {current.relative_humidity_2m}%
                  </strong>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-icon">
                  <Wind size={21} />
                </span>
                <div>
                  <p>Wind speed</p>
                  <strong>
                    {Math.round(current.wind_speed_10m)} km/h
                  </strong>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-icon">
                  <Droplets size={21} />
                </span>
                <div>
                  <p>Precipitation</p>
                  <strong>{current.precipitation} mm</strong>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-icon">
                  <Eye size={21} />
                </span>
                <div>
                  <p>Conditions</p>
                  <strong>
                    {current.is_day ? "Daytime" : "Nighttime"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="sun-times">
              <div>
                <Sunrise size={21} />
                <span>Sunrise</span>
                <strong>{formatTime(daily.sunrise[0])}</strong>
              </div>
              <div>
                <Sunset size={21} />
                <span>Sunset</span>
                <strong>{formatTime(daily.sunset[0])}</strong>
              </div>
            </div>
          </section>

          <section className="forecast-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">PLAN AHEAD</p>
                <h2>7-Day Forecast</h2>
              </div>
              <span className="forecast-badge">
                <CalendarDays size={15} />
                7 days
              </span>
            </div>

            <div className="forecast-grid">
              {daily.time.map((day, index) => {
                const [dayDescription, dayEmoji] =
                  describeWeather(daily.weather_code[index]);

                return (
                  <article
                    className={`forecast-day ${
                      index === 0 ? "forecast-today" : ""
                    }`}
                    key={day}
                  >
                    <p className="forecast-day-name">
                      {formatDay(day, index)}
                    </p>
                    <span className="forecast-emoji" role="img">
                      {dayEmoji}
                    </span>
                    <p className="forecast-condition">
                      {dayDescription}
                    </p>
                    <div className="forecast-temperatures">
                      <strong>
                        {Math.round(
                          daily.temperature_2m_max[index]
                        )}°
                      </strong>
                      <span>
                        {Math.round(
                          daily.temperature_2m_min[index]
                        )}°
                      </span>
                    </div>
                    <p className="rain-chance">
                      <Droplets size={13} />
                      {daily.precipitation_probability_max?.[index] ??
                        0}
                      %
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}

      <footer className="footer">
        <p>
          Built with React & Open-Meteo
        </p>
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
        >
          Weather data by Open-Meteo
        </a>
        <p>Day 5 / 30 — Keep learning. Keep building. 🚀</p>
      </footer>
    </main>
  );
}

export default App;
