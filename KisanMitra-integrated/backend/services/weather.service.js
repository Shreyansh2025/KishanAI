// services/weather.service.js
// All weather calls use lat/lon — no city name needed.
const axios = require("axios");

const OW_BASE = "https://api.openweathermap.org/data/2.5";

/**
 * Fetch current weather by coordinates.
 * Falls back to mock data when API key is not configured.
 * @param {number} lat
 * @param {number} lon
 * @returns {Object} normalised weather object
 */
const getWeatherByCoords = async (lat, lon) => {
  const key = process.env.OPENWEATHER_API_KEY;

  if (!key || key === "your_openweather_api_key_here") {
    return mockWeather(lat, lon);
  }

  try {
    const { data: d } = await axios.get(`${OW_BASE}/weather`, {
      params: { lat, lon, appid: key, units: "metric" },
      timeout: 8000,
    });

    return {
      city:        d.name,
      country:     d.sys.country,
      lat,
      lon,
      temperature: d.main.temp,
      feelsLike:   d.main.feels_like,
      humidity:    d.main.humidity,
      pressure:    d.main.pressure,
      windSpeed:   d.wind.speed,
      windDeg:     d.wind.deg,
      condition:   d.weather[0].main,
      description: d.weather[0].description,
      icon:        `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`,
      cloudiness:  d.clouds.all,
      rainLastHr:  d.rain?.["1h"] ?? 0,
      sunrise:     new Date(d.sys.sunrise * 1000).toISOString(),
      sunset:      new Date(d.sys.sunset  * 1000).toISOString(),
      timestamp: new Date(d.dt * 1000).toISOString(), // Weather station ka last update time
      currentTime: new Date().toISOString(),         // Aapka bilkul abhi ka real time
      isMock: false,
    };
  } catch (err) {
    if (err.response?.status === 401) throw new Error("Invalid OpenWeather API key.");
    throw new Error(`Weather API error: ${err.message}`);
  }
};

const mockWeather = (lat, lon) => {
  const now = new Date(); // Get the exact moment this function is called
  
  // Optional: Create a fake sunrise/sunset based on today
  const sunrise = new Date(now);
  sunrise.setHours(6, 30, 0); 
  
  const sunset = new Date(now);
  sunset.setHours(18, 45, 0);

  return {
    city: "Demo Location",
    country: "IN",
    lat,
    lon,
    temperature: 28.5,
    feelsLike: 31.0,
    humidity: 65,
    pressure: 1012,
    windSpeed: 3.2,
    windDeg: 200,
    condition: "Clear",
    description: "clear sky",
    icon: "https://openweathermap.org/img/wn/01d@2x.png",
    cloudiness: 8,
    rainLastHr: 0,
    sunrise: new Date(now.setHours(6, 0, 0)).toISOString(),
    sunset: new Date(now.setHours(18, 30, 0)).toISOString(),
    timestamp: new Date().toISOString(), // Mock mein ye dono same ho sakte hain
    currentTime: new Date().toISOString(), // Bilkul abhi ka live time
    isMock: true,
  };
};

module.exports = { getWeatherByCoords };
