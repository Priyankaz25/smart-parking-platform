const tabs = ["Hourly", "Monthly", "Airport"];

function SearchPanel({
  filters,
  onChange,
  activeTab,
  setActiveTab,
  onSearch,
  isLoading,
}) {
  return (
    <section className="search-card">
      <div className="search-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="search-grid">
        <label>
          <span>Location</span>
          <input
            type="text"
            placeholder="Enter a place"
            value={filters.location}
            onChange={(event) => onChange("location", event.target.value)}
          />
        </label>

        <label>
          <span>From</span>
          <input
            type="datetime-local"
            value={filters.startTime}
            onChange={(event) => onChange("startTime", event.target.value)}
          />
        </label>

        <label>
          <span>Until</span>
          <input
            type="datetime-local"
            value={filters.endTime}
            onChange={(event) => onChange("endTime", event.target.value)}
          />
        </label>

        <label>
          <span>Vehicle Type</span>
          <select
            value={filters.vehicleType}
            onChange={(event) => onChange("vehicleType", event.target.value)}
          >
            <option value="all">All Vehicles</option>
            <option value="2-wheeler">2-wheeler</option>
            <option value="4-wheeler">4-wheeler</option>
          </select>
        </label>
      </div>

      <button type="button" className="btn btn-cta" onClick={onSearch} disabled={isLoading}>
        {isLoading ? "Searching..." : "Show parking spaces"}
      </button>
    </section>
  );
}

export default SearchPanel;
