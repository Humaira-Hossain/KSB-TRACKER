function Metric({ label, value, detail }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function DashboardPage({ tasks, progress, loading, error, onCreateTask, onViewTasks }) {
  const completedTasks = tasks.filter((task) => task.status === 'completed').length

  return (
    <main className="app-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">KSB tracker</p>
          <h1>Overview</h1>
          <p>Track your evidence, KSB coverage, and acceptance criteria progress.</p>
        </div>
        <button type="button" onClick={onCreateTask}>Create task</button>
      </section>

      {error && <p className="message error" role="alert">{error}</p>}

      {loading ? <p className="loading">Loading overview…</p> : (
        <>
          <section className="metric-grid" aria-label="Progress metrics">
            <Metric label="Tasks" value={tasks.length} detail={`${completedTasks} completed`} />
            <Metric
              label="KSB evidence"
              value={`${progress?.ksbs?.percentage ?? 0}%`}
              detail={`${progress?.ksbs?.evidenced ?? 0} of ${progress?.ksbs?.total ?? 0} evidenced`}
            />
            <Metric
              label="Acceptance criteria"
              value={`${progress?.acceptance_criteria?.percentage ?? 0}%`}
              detail={`${progress?.acceptance_criteria?.complete ?? 0} of ${progress?.acceptance_criteria?.total ?? 0} complete`}
            />
          </section>

          <section className="panel dashboard-next-step">
            <div>
              <h2>Continue building evidence</h2>
              <p>Open an existing task or create a new one to start the evidence workflow.</p>
            </div>
            <button className="secondary" type="button" onClick={onViewTasks}>View tasks</button>
          </section>
        </>
      )}
    </main>
  )
}

export default DashboardPage
