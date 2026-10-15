
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDistrictHistory } from "../services/api";

function formatMonth(value) {
  if (!value) return "—";

  // Supports ISO date strings such as 2016-01-01.
  const match = String(value).match(/^(\d{4})-(\d{2})/);
  if (!match) return String(value).slice(0, 10);

  const [, year, month] = match;
  return `${month}/${year}`;
}

function Metric({ label, value, unit }) {
  return (
    <article className="analytics-metric">
      <span>{label}</span>
      <strong>
        {value == null || !Number.isFinite(value)
          ? "—"
          : value.toFixed(2)}
        {value != null && Number.isFinite(value) ? unit : ""}
      </strong>
    </article>
  );
}

export default function RainfallAnalytics({ districts = [] }) {
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (districts.length && !selectedDistrict) {
      setSelectedDistrict(districts[0]);
    }
  }, [districts, selectedDistrict]);

  useEffect(() => {
    if (!selectedDistrict) return;

    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError("");
      setHistory([]);

      try {
        const result = await getDistrictHistory(selectedDistrict);

        if (!cancelled) {
          const records = (result.history ?? [])
            .map((item) => ({
              ...item,
              monthLabel: formatMonth(item.date),
              rainfall: Number(item.rainfall_mm),
              normal: Number(item.normal_rainfall_mm),
              spi: Number(item.spi_3),
              deviation: Number(item.rainfall_deviation_pct),
            }))
            .sort((a, b) => String(a.date).localeCompare(String(b.date)));

          setHistory(records);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load historical data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedDistrict]);

  const validRainfall = history.filter(
    (row) => Number.isFinite(row.rainfall)
  );

  const avgRainfall = validRainfall.length
    ? validRainfall.reduce((sum, row) => sum + row.rainfall, 0) /
      validRainfall.length
    : null;

  const validNormal = history.filter(
    (row) => Number.isFinite(row.normal) && row.normal >= 0
  );

  const avgNormal = validNormal.length
    ? validNormal.reduce((sum, row) => sum + row.normal, 0) /
      validNormal.length
    : null;

  const validSpi = history.filter((row) => Number.isFinite(row.spi));
  const latestSpi = validSpi.length
    ? validSpi[validSpi.length - 1].spi
    : null;

  return (
    <section className="analytics-section">
      <div className="analytics-heading">
        <div>
          <p className="eyebrow">HISTORICAL CLIMATE DATA</p>
          <h2>Rainfall Analytics</h2>
          <p className="analytics-description">
            Explore monthly rainfall and drought indicators by district.
          </p>
        </div>

        <label className="district-select-label">
          Select district
          <select
            value={selectedDistrict}
            onChange={(event) => setSelectedDistrict(event.target.value)}
          >
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="analytics-message">Loading historical data…</p>}
      {error && <p className="analytics-error">{error}</p>}

      {!loading && !error && history.length > 0 && (
        <>
          <div className="analytics-metrics">
            <Metric label="Average monthly rainfall" value={avgRainfall} unit=" mm" />
            <Metric label="Average normal rainfall" value={avgNormal} unit=" mm" />
            <Metric label="Latest available SPI-3" value={latestSpi} unit="" />
            <Metric label="Monthly records" value={history.length} unit="" />
          </div>

          <article className="chart-panel">
            <div className="chart-title">
              <h3>Actual vs. Normal Rainfall</h3>
              <p>{selectedDistrict} · Monthly observations</p>
            </div>

            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={history}
                  margin={{ top: 12, right: 20, left: 4, bottom: 8 }}
                >
                  <CartesianGrid stroke="#e8edf3" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    minTickGap={25}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={48}
                    label={{
                      value: "Rainfall (mm)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: 11 },
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rainfall"
                    name="Actual rainfall"
                    stroke="#168bca"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="normal"
                    name="Normal rainfall"
                    stroke="#e9a23b"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="chart-panel">
            <div className="chart-title">
              <h3>Historical SPI-3 Trend</h3>
              <p>Negative values indicate drier-than-usual conditions in the index.</p>
            </div>

            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={history}
                  margin={{ top: 12, right: 20, left: 4, bottom: 8 }}
                >
                  <CartesianGrid stroke="#e8edf3" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    minTickGap={25}
                  />
                  <YAxis tick={{ fontSize: 11 }} width={48} />
                  <Tooltip />
                  <ReferenceLine y={0} stroke="#7f8b99" />
                  <ReferenceLine y={-1} stroke="#d97706" strokeDasharray="4 4" />
                  <ReferenceLine y={-1.5} stroke="#dc6545" strokeDasharray="4 4" />
                  <ReferenceLine y={-2} stroke="#c53030" strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="spi"
                    name="SPI-3"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        </>
      )}

      {!loading && !error && history.length === 0 && (
        <p className="analytics-message">
          No historical observations are available for this district.
        </p>
      )}

      <p className="analytics-disclaimer">
        Synthetic development data only. SPI interpretation is provisional
        until the index is validated using official rainfall observations.
      </p>
    </section>
  );
}
