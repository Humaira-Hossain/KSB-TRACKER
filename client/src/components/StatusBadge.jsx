function StatusBadge({ status }) {
  return <span className="status">{status?.replaceAll('_', ' ')}</span>
}

export default StatusBadge
