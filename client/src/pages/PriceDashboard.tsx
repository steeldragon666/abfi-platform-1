import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Truck,
  BarChart3,
} from "lucide-react";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Mock data for 30-day price trends
const feedstockPrices = [
  { date: "2024-12-01", ethanol: 1.42, biodiesel: 1.38, woodchip: 85 },
  { date: "2024-12-02", ethanol: 1.44, biodiesel: 1.39, woodchip: 87 },
  { date: "2024-12-03", ethanol: 1.43, biodiesel: 1.41, woodchip: 86 },
  { date: "2024-12-04", ethanol: 1.45, biodiesel: 1.40, woodchip: 88 },
  { date: "2024-12-05", ethanol: 1.47, biodiesel: 1.42, woodchip: 89 },
  { date: "2024-12-06", ethanol: 1.46, biodiesel: 1.43, woodchip: 90 },
  { date: "2024-12-07", ethanol: 1.48, biodiesel: 1.44, woodchip: 91 },
  { date: "2024-12-08", ethanol: 1.50, biodiesel: 1.45, woodchip: 92 },
  { date: "2024-12-09", ethanol: 1.49, biodiesel: 1.46, woodchip: 93 },
  { date: "2024-12-10", ethanol: 1.51, biodiesel: 1.47, woodchip: 94 },
  { date: "2024-12-11", ethanol: 1.52, biodiesel: 1.48, woodchip: 95 },
  { date: "2024-12-12", ethanol: 1.50, biodiesel: 1.47, woodchip: 93 },
  { date: "2024-12-13", ethanol: 1.53, biodiesel: 1.49, woodchip: 96 },
  { date: "2024-12-14", ethanol: 1.55, biodiesel: 1.50, woodchip: 97 },
  { date: "2024-12-15", ethanol: 1.54, biodiesel: 1.51, woodchip: 96 },
  { date: "2024-12-16", ethanol: 1.56, biodiesel: 1.52, woodchip: 98 },
  { date: "2024-12-17", ethanol: 1.58, biodiesel: 1.53, woodchip: 99 },
  { date: "2024-12-18", ethanol: 1.57, biodiesel: 1.54, woodchip: 100 },
  { date: "2024-12-19", ethanol: 1.59, biodiesel: 1.55, woodchip: 101 },
  { date: "2024-12-20", ethanol: 1.60, biodiesel: 1.56, woodchip: 102 },
  { date: "2024-12-21", ethanol: 1.58, biodiesel: 1.55, woodchip: 100 },
  { date: "2024-12-22", ethanol: 1.61, biodiesel: 1.57, woodchip: 103 },
  { date: "2024-12-23", ethanol: 1.62, biodiesel: 1.58, woodchip: 104 },
  { date: "2024-12-24", ethanol: 1.60, biodiesel: 1.56, woodchip: 102 },
  { date: "2024-12-25", ethanol: 1.63, biodiesel: 1.59, woodchip: 105 },
  { date: "2024-12-26", ethanol: 1.65, biodiesel: 1.60, woodchip: 106 },
  { date: "2024-12-27", ethanol: 1.64, biodiesel: 1.61, woodchip: 105 },
  { date: "2024-12-28", ethanol: 1.66, biodiesel: 1.62, woodchip: 107 },
  { date: "2024-12-29", ethanol: 1.68, biodiesel: 1.63, woodchip: 108 },
  { date: "2024-12-30", ethanol: 1.67, biodiesel: 1.64, woodchip: 109 },
];

// Current price cards data
const currentPrices = [
  {
    name: "Ethanol",
    price: 1.67,
    unit: "$/L",
    change: 17.6,
    direction: "up" as const,
    volume: "12.5M L",
    color: "#10b981",
  },
  {
    name: "Biodiesel",
    price: 1.64,
    unit: "$/L",
    change: 18.8,
    direction: "up" as const,
    volume: "8.2M L",
    color: "#3b82f6",
  },
  {
    name: "Woodchip",
    price: 109,
    unit: "$/t",
    change: 28.2,
    direction: "up" as const,
    volume: "45K t",
    color: "#f59e0b",
  },
];

// Volume traded yesterday
const volumeMetrics = [
  { name: "Total Value", value: "$24.8M", change: "+12%" },
  { name: "Transactions", value: "156", change: "+8%" },
  { name: "Avg Order Size", value: "$159K", change: "+4%" },
];

export default function PriceDashboard() {
  const [hoveredPrice, setHoveredPrice] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8 text-[#D4AF37]" />
            <h1 className="text-3xl font-bold">Price Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Real-time feedstock pricing updated every 15 minutes. All prices in AUD.
          </p>
        </div>

        {/* Current Price Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {currentPrices.map((item) => (
            <Card
              key={item.name}
              className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              onMouseEnter={() => setHoveredPrice(item.name)}
              onMouseLeave={() => setHoveredPrice(null)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </CardDescription>
                  <Badge
                    variant={item.direction === "up" ? "default" : "destructive"}
                    className={`${
                      item.direction === "up"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.direction === "up" ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {item.change.toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">
                    {item.name === "Woodchip" ? `$${item.price}` : `$${item.price.toFixed(2)}`}
                  </span>
                  <span className="text-gray-500 mb-1">{item.unit}</span>
                </div>
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                  <Truck className="h-4 w-4" />
                  <span>Volume yesterday: {item.volume}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 30-Day Price Trend Chart */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                  30-Day Price Trends
                </CardTitle>
                <CardDescription>
                  Historical pricing for all feedstock categories
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-[#D4AF37] text-[#D4AF37]">
                Live Data
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={feedstockPrices}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis
                  yAxisId="price"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `$${v}`}
                  stroke="#6b7280"
                  domain={[1.3, 1.8]}
                />
                <YAxis
                  yAxisId="woodchip"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `$${v}`}
                  stroke="#6b7280"
                  domain={[80, 115]}
                />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-AU", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })
                  }
                  formatter={(value: number, name: string) => {
                    if (name === "woodchip") return [`$${value}/t`, "Woodchip"];
                    return [`$${value.toFixed(2)}/L`, name.charAt(0).toUpperCase() + name.slice(1)];
                  }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend
                  formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="ethanol"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: "#10b981" }}
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="biodiesel"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: "#3b82f6" }}
                />
                <Line
                  yAxisId="woodchip"
                  type="monotone"
                  dataKey="woodchip"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: "#f59e0b" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume Metrics and Request Quote */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Volume Metrics */}
          {volumeMetrics.map((metric) => (
            <Card key={metric.name}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <DollarSign className="h-8 w-8 text-[#D4AF37]" />
                  <span className="text-green-600 text-sm font-medium">
                    {metric.change}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm text-gray-600">{metric.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Request Quote CTA */}
          <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 border-[#D4AF37]/30">
            <CardContent className="pt-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="font-semibold text-lg mb-2">Ready to Trade?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get personalized quotes from verified suppliers.
                </p>
              </div>
              <Link href="/quote-request">
                <Button className="w-full bg-[#D4AF37] text-black hover:bg-[#E5C158]">
                  Request Quote
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
