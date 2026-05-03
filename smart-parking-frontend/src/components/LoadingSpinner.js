function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="loading-wrap" role="status">
      <div className="loading-spinner" />
      <span>{label}</span>
    </div>
  );
}

export default LoadingSpinner;
