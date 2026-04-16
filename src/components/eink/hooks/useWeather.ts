import { useEffect, useState } from "react";

export type WeatherData = {
  temp: number | null;
  code: number | null;
};

export function useWeather(): WeatherData | null {
  const [data, setData] = useState<WeatherData | null>(null);

  useEffect(() => {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=-33.45&longitude=-70.66&current=temperature_2m,weather_code&timezone=America/Santiago";
    fetch(url)
      .then((r) => r.json())
      .then((d) =>
        setData({
          temp: Math.round(d.current.temperature_2m),
          code: d.current.weather_code,
        }),
      )
      .catch(() => setData({ temp: null, code: null }));
  }, []);

  return data;
}
