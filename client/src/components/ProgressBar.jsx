function ProgressBar({ label, value }) {
  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-label={label}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={value}
    >
      <span className="progress-bar-fill" style={{ width: `${value}%` }} />
    </div>
  )
}

export default ProgressBar
