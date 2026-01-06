import { useState } from "react";
import { TrendingUp, DollarSign, Percent } from "lucide-react";

export default function EarningsCalculator() {
  const [currentPrice, setCurrentPrice] = useState<string>("85");
  const [annualVolume, setAnnualVolume] = useState<string>("500");
  const [feedstockType, setFeedstockType] = useState<string>("bagasse");

  // Market data for different feedstock types (average BioFeed AU prices)
  const marketPrices: Record<string, number> = {
    bagasse: 120,
    straw: 95,
    woodchips: 110,
    corn_stover: 105,
    cotton_trash: 115,
  };

  const calculateResults = () => {
    const current = parseFloat(currentPrice) || 0;
    const volume = parseFloat(annualVolume) || 0;
    const directPrice = marketPrices[feedstockType] || 120;

    const currentRevenue = current * volume;
    const directRevenue = directPrice * volume;
    const increase = directRevenue - currentRevenue;
    const percentIncrease = current > 0 ? (increase / currentRevenue) * 100 : 0;

    return {
      currentRevenue,
      directRevenue,
      increase,
      percentIncrease,
      directPrice,
    };
  };

  const results = calculateResults();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const feedstockOptions = [
    { value: "bagasse", label: "Bagasse (Sugarcane)" },
    { value: "straw", label: "Cereal Straw" },
    { value: "woodchips", label: "Wood Chips" },
    { value: "corn_stover", label: "Corn Stover" },
    { value: "cotton_trash", label: "Cotton Trash" },
  ];

  return (
    <div
      className="rounded-3xl p-10"
      style={{
        background: "white",
        boxShadow: "0 8px 32px rgba(26, 46, 26, 0.12)",
        border: "2px solid #dcfce7",
      }}
    >
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "linear-gradient(135deg, #2d5a27, #4a7c43)",
          }}
        >
          <TrendingUp className="h-8 w-8 text-black" />
        </div>
        <h3
          className="text-3xl mb-2"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            color: "#1a2e1a",
          }}
        >
          Calculate Your Earnings Increase
        </h3>
        <p style={{ color: "#4a5a4a", fontSize: "15px", fontWeight: 300 }}>
          See how much more you could earn with direct market access
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Feedstock Type */}
        <div>
          <label
            className="block text-sm font-semibold mb-2 uppercase tracking-wide"
            style={{ color: "#6b7c6b" }}
          >
            Feedstock Type
          </label>
          <select
            value={feedstockType}
            onChange={e => setFeedstockType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-base font-medium transition-all focus:outline-none focus:ring-2"
            style={{
              background: "#f5f0e6",
              border: "2px solid #dcfce7",
              color: "#1a2e1a",
            }}
          >
            {feedstockOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Current Broker Price */}
        <div>
          <label
            className="block text-sm font-semibold mb-2 uppercase tracking-wide"
            style={{ color: "#6b7c6b" }}
          >
            Current Broker Price ($/tonne)
          </label>
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold"
              style={{ color: "#6b7c6b" }}
            >
              $
            </span>
            <input
              type="number"
              value={currentPrice}
              onChange={e => setCurrentPrice(e.target.value)}
              placeholder="85"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-base font-medium transition-all focus:outline-none focus:ring-2"
              style={{
                background: "#f5f0e6",
                border: "2px solid #dcfce7",
                color: "#1a2e1a",
                fontFamily: 'var(--font-numeric)',
              }}
            />
          </div>
        </div>

        {/* Annual Volume */}
        <div>
          <label
            className="block text-sm font-semibold mb-2 uppercase tracking-wide"
            style={{ color: "#6b7c6b" }}
          >
            Annual Volume (tonnes)
          </label>
          <input
            type="number"
            value={annualVolume}
            onChange={e => setAnnualVolume(e.target.value)}
            placeholder="500"
            className="w-full px-4 py-3 rounded-xl text-base font-medium transition-all focus:outline-none focus:ring-2"
            style={{
              background: "#f5f0e6",
              border: "2px solid #dcfce7",
              color: "#1a2e1a",
              fontFamily: 'var(--font-numeric)',
            }}
          />
        </div>
      </div>

      {/* Results */}
      <div
        className="rounded-2xl p-8 mb-6"
        style={{
          background: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
          border: "2px solid #22c55e",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Current Revenue */}
          <div className="text-center">
            <div
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "#6b7c6b" }}
            >
              Current Annual Revenue
            </div>
            <div
              className="text-3xl font-bold mb-1"
              style={{
                color: "#dc2626",
                fontFamily: 'var(--font-numeric)',
              }}
            >
              {formatCurrency(results.currentRevenue)}
            </div>
            <div className="text-xs" style={{ color: "#6b7c6b" }}>
              @ ${currentPrice || 0}/tonne
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="text-4xl" style={{ color: "#2d5a27" }}>
              →
            </div>
          </div>

          {/* BioFeed AU Revenue */}
          <div className="text-center">
            <div
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "#6b7c6b" }}
            >
              BioFeed AU Revenue
            </div>
            <div
              className="text-3xl font-bold mb-1"
              style={{
                color: "#22c55e",
                fontFamily: 'var(--font-numeric)',
              }}
            >
              {formatCurrency(results.directRevenue)}
            </div>
            <div className="text-xs" style={{ color: "#6b7c6b" }}>
              @ ${results.directPrice}/tonne
            </div>
          </div>
        </div>

        {/* Increase Highlight */}
        <div
          className="rounded-xl p-6 text-center"
          style={{
            background: "white",
            border: "3px solid #b8860b",
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <DollarSign className="h-6 w-6" style={{ color: "#b8860b" }} />
            <div
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "#6b7c6b" }}
            >
              Your Annual Gain
            </div>
          </div>
          <div
            className="text-5xl font-bold mb-2"
            style={{
              color: "#b8860b",
              fontFamily: 'var(--font-numeric)',
            }}
          >
            {formatCurrency(results.increase)}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Percent className="h-5 w-5" style={{ color: "#2d5a27" }} />
            <span className="text-xl font-bold" style={{ color: "#2d5a27" }}>
              {results.percentIncrease.toFixed(1)}% increase
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "#f5f0e6" }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: "#6b7c6b" }}
          >
            Per Tonne Gain
          </div>
          <div
            className="text-2xl font-bold"
            style={{
              color: "#2d5a27",
              fontFamily: 'var(--font-numeric)',
            }}
          >
            $
            {(results.directPrice - (parseFloat(currentPrice) || 0)).toFixed(0)}
          </div>
        </div>

        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "#f5f0e6" }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: "#6b7c6b" }}
          >
            Monthly Gain
          </div>
          <div
            className="text-2xl font-bold"
            style={{
              color: "#2d5a27",
              fontFamily: 'var(--font-numeric)',
            }}
          >
            {formatCurrency(results.increase / 12)}
          </div>
        </div>

        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "#f5f0e6" }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: "#6b7c6b" }}
          >
            5-Year Gain
          </div>
          <div
            className="text-2xl font-bold"
            style={{
              color: "#2d5a27",
              fontFamily: 'var(--font-numeric)',
            }}
          >
            {formatCurrency(results.increase * 5)}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center">
        <p
          style={{
            fontSize: "12px",
            color: "#6b7c6b",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          * Calculations based on current regional market averages. Actual
          prices vary by location, quality, delivery terms, and market
          conditions. BioFeed AU prices shown are platform averages for
          verified, delivered feedstock.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center mt-8">
        <button
          className="px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #2d5a27, #4a7c43)",
            color: "white",
            boxShadow: "0 4px 20px rgba(45, 90, 39, 0.3)",
          }}
        >
          Start Earning More Today
        </button>
      </div>
    </div>
  );
}
