function SearchForm({
  form,
  errors,
  onChange,
  onSubmit,
  isLoading,
}) {
  const isFormFilled = Boolean(form.location && form.date && form.startTime && form.endTime);

  return (
    <section className="mx-auto max-w-6xl rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <label className="relative">
          <span className="text-sm text-gray-600">Location</span>
          <input
            type="text"
            value={form.location}
            onChange={(e) => onChange("location", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 ${errors.location ? "border-red-400" : "border-gray-200"}`}
            placeholder="Enter destination"
            autoComplete="off"
            spellCheck={false}
          />
          {errors.location && <small className="field-error">{errors.location}</small>}
        </label>

        <label>
  <span className="text-sm text-gray-600">Date</span>
  <input
    type="date"
    value={form.date}
    min={new Date().toISOString().split("T")[0]}
    max={
      new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
    }
    onChange={(e) => onChange("date", e.target.value)}
    className={`w-full rounded-lg border px-3 py-2 ${
      errors.date ? "border-red-400" : "border-gray-200"
    }`}
  />
  {errors.date && <small className="field-error">{errors.date}</small>}
</label>

        <label>
          <span className="text-sm text-gray-600">Start time</span>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => onChange("startTime", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 ${errors.startTime ? "border-red-400" : "border-gray-200"}`}
          />
          {errors.startTime && <small className="field-error">{errors.startTime}</small>}
        </label>

        <label>
          <span className="text-sm text-gray-600">End time</span>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => onChange("endTime", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 ${errors.endTime ? "border-red-400" : "border-gray-200"}`}
          />
          {errors.endTime && <small className="field-error">{errors.endTime}</small>}
        </label>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isLoading || !isFormFilled || Object.values(errors).some(Boolean)}
        className="mt-4 w-full rounded-xl bg-green-600 px-4 py-3 text-white font-semibold transition hover:bg-green-700 disabled:opacity-50"
      >
        {isLoading ? "Searching..." : "Show parking spaces"}
      </button>
    </section>
  );
}

export default SearchForm;
