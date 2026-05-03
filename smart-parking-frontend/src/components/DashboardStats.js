function DashboardStats({ items }) {
  return (
    <div className="stats-grid">
      {items.map((item) => (
        <div key={item.label} className="stat-card">
          <p>{item.label}</p>
          <h3>{item.value}</h3>
        </div>
      ))}
    </div>
  );
}

export default DashboardStats;
