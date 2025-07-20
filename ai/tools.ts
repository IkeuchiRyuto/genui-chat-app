import { tool as createTool } from "ai";
import { z } from "zod";

// 天気情報ツール
export const weatherTool = createTool({
  description: "Display the weather for a location",
  parameters: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  execute: async function ({ location }) {
    // 実際のAPIではなく、シミュレーション
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const weathers = ["Sunny", "Cloudy", "Rainy", "Snowy"];
    const weather = weathers[Math.floor(Math.random() * weathers.length)];
    const temperature = Math.floor(Math.random() * 30) + 5;
    return { weather, temperature, location };
  },
});

// 株価情報ツール
export const stockTool = createTool({
  description: "Get price for a stock symbol",
  parameters: z.object({
    symbol: z
      .string()
      .describe("The stock symbol to get the price for (e.g., AAPL, GOOGL)"),
  }),
  execute: async function ({ symbol }) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const price = Math.floor(Math.random() * 1000) + 50;
    const change = (Math.random() - 0.5) * 20;
    return {
      symbol: symbol.toUpperCase(),
      price,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(((change / price) * 100).toFixed(2)),
    };
  },
});

// チャート生成ツール
export const chartTool = createTool({
  description: "Generate a chart with data",
  parameters: z.object({
    title: z.string().describe("The title of the chart"),
    data: z
      .array(
        z.object({
          label: z.string(),
          value: z.number(),
        })
      )
      .describe("The data points for the chart"),
    type: z
      .enum(["bar", "line", "pie"])
      .describe("The type of chart to generate"),
  }),
  execute: async function ({ title, data, type }) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { title, data, type };
  },
});

// カレンダーイベントツール
export const calendarTool = createTool({
  description: "Create or display calendar events",
  parameters: z.object({
    title: z.string().describe("Event title"),
    date: z.string().describe("Event date (YYYY-MM-DD)"),
    time: z.string().describe("Event time (HH:MM)"),
    description: z.string().optional().describe("Event description"),
  }),
  execute: async function ({ title, date, time, description }) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { title, date, time, description };
  },
});

export const tools = {
  displayWeather: weatherTool,
  getStockPrice: stockTool,
  generateChart: chartTool,
  createCalendarEvent: calendarTool,
};
