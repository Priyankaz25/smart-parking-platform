import { nowLocalInputValue } from "../utils/validation";

const tabs = ["Hourly", "Monthly", "Airport"];

function SearchBar({
  filters,
  errors,
  activeTab,
  setActiveTab,
  onChange,
  onSearch,
  isLoading,
}) {
  const nowValue = nowLocalInputValue();

  return (
    <section className="mx-auto max-w-6xl rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-green-600 text-white shadow"
                : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <label>
          <span className="text-sm text-gray-600">Location</span>
          <input
            type="text"
            placeholder="Enter a place"
            value={filters.location}
            onChange={(event) => onChange("location", event.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-green-500"
          />
          {errors.location && <small className="field-error">{errors.location}</small>}
        </label>

        <label>
          <span className="text-sm text-gray-600">From</span>
          <input
            type="datetime-local"
            value={filters.startTime}
            min={nowValue}
            onChange={(event) => onChange("startTime", event.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-green-500"
          />
          {errors.startTime && <small className="field-error">{errors.startTime}</small>}
        </label>

        <label>
          <span className="text-sm text-gray-600">Until</span>
          <input
            type="datetime-local"
            value={filters.endTime}
            min={filters.startTime || nowValue}
            onChange={(event) => onChange("endTime", event.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-green-500"
          />
          {errors.endTime && <small className="field-error">{errors.endTime}</small>}
        </label>

        <label>
          <span className="text-sm text-gray-600">Vehicle Type</span>
          <input
            value="4W only"
            readOnly
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600"
          />
        </label>
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-xl bg-green-600 px-4 py-3 text-white font-semibold transition hover:bg-green-700"
        onClick={onSearch}
        disabled={isLoading}
      >
        {isLoading ? "Searching..." : "Show parking spaces"}
      </button>
    </section>
  );
}

export default SearchBar;
