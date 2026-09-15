import type { IWeatherProvider } from "../interfaces/llm";

export class StubWeatherProvider implements IWeatherProvider {
  readonly id = "stub-weather";

  async getTodayForecast(): Promise<{ condition: string; rainProbability: number }> {
    const month = new Date().getMonth();
    const rainProbability =
      month >= 10 || month <= 2 ? 55 : month >= 5 && month <= 8 ? 25 : 40;

    return {
      condition: rainProbability >= 50 ? "chuva" : "parcialmente nublado",
      rainProbability,
    };
  }
}
