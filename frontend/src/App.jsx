import RainfallAnalytics from "./components/RainfallAnalytics";
import { useEffect, useState } from "react";
import {
  Activity,
  CloudRain,
  MapPin,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  getCurrentDrought,
  getDistricts,
  getHealth,
} from "./services/api";
import "./App.css";

function App() {
  const [summary, setSummary] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [health, drought, districtData] = await Promise.all([
        getHealth(),
        getCurrentDrought(),
        getDistricts(),
      ]);

      setApiStatus(health.status);
      setSummary(drought);
      setDistricts(drought.districts ?? []);
    } catch (err) {
      setApiStatus("Disconnected");
      setError(err.message || "Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const visibleDistricts = districts
    .filter((district) =>
      district.district_name
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const categories = summary?.category_counts ?? {};

  function countCategory(keyword) {
    return Object.entries(categories)
      .filter(([name]) => name.includes(keyword))
      .reduce((total, [, count]) => total + count, 0);
  }

  const cards = [
    {
      label: "Districts Monitored",
      value: summary?.total_districts ?? 0,
      icon: MapPin,
      color: "blue",
    },
    {
      label: "Normal",
      value: countCategory("normal"),
      icon: Activity,
      color: "green",
    },
    {
      label: "Moderate",
      value: countCategory("moderate"),
      icon: CloudRain,
      color: "yellow",
    },
    {
      label: "Severe / Extreme",
      value: countCategory("severe") + countCategory("extreme"),
      icon: AlertTriangle,
      color: "red",
    },
  ];

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><CloudRain size={25} /></div>
          <div>
            <h1>AP Drought Monitor</h1>
            <p>Andhra Pradesh · Climate Dashboard</p>
          </div>
        </div>

        <div className="header-right">
          <span className={`status ${apiStatus === "healthy" ? "online" : ""}`}>
            <span className="status-dot" />
            API {apiStatus}
          </span>
          <button className="refresh-btn" onClick={loadDashboard}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">MONITORING OVERVIEW</p>
          <h2>Drought Risk Dashboard</h2>
          <p className="subtitle">
            Explore rainfall observations and district-level drought indicators.
          </p>
        </div>
        <span className="demo-badge">SYNTHETIC DEMO DATA</span>
      </section>

      {error && (
        <div className="error-message">
          <strong>Unable to load data:</strong> {error}
          <p>Check that MongoDB and FastAPI are running.</p>
        </div>
      )}

      <section className="summary-grid">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <article className="summary-card" key={label}>
            <div className={`card-icon ${color}`}><Icon size={21} /></div>
            <p>{label}</p>
            <strong>{loading ? "…" : value}</strong>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>District Drought Assessment</h3>
            <p>Latest available monthly record for each district</p>
          </div>
          <input
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search district..."
            aria-label="Search districts"
          />
        </div>

        {loading ? (
          <p className="message">Loading district data...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>District</th>
                  <th>Date</th>
                  <th>Rainfall (mm)</th>
                  <th>Normal (mm)</th>
                  <th>SPI-3</th>
                  <th>Drought Category</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {visibleDistricts.map((district) => (
                  <tr key={district.district_code}>
                    <td className="district-name">{district.district_name}</td>
                    <td>{String(district.date ?? "—").slice(0, 10)}</td>
                    <td>{Number(district.rainfall_mm ?? 0).toFixed(1)}</td>
                    <td>{Number(district.normal_rainfall_mm ?? 0).toFixed(1)}</td>
                    <td>{district.spi_3 == null ? "—" : Number(district.spi_3).toFixed(2)}</td>
                    <td>
                      <span className={`category ${String(district.drought_category ?? "unknown").toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                        {district.drought_category ?? "Unknown"}
                      </span>
                    </td>
                    <td>{district.risk_score ?? "—"}</td>
                  </tr>
                ))}
                {visibleDistricts.length === 0 && (
                  <tr>
                    <td colSpan="7" className="message">No matching districts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>
        <span>AP Drought Monitoring · V1</span>
        <span>For development and demonstration only</span>
      </footer>
    </main>
  );
}

export default App;
