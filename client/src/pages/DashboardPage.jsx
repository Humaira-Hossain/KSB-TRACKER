import ProgressBar from '../components/ProgressBar'

function Metric({ label, value, detail }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function DashboardPage({ tasks, progress, loading, error, onCreateTask, onViewTasks, onViewKsbs, onViewAcceptanceCriteria }) {
  const completedTasks = tasks.filter((task) => task.status === 'completed').length
  const ksbEvidenced = progress?.ksbs?.evidenced ?? 0
  const ksbTotal = progress?.ksbs?.total ?? 0
  const acceptanceCriteriaComplete = progress?.acceptance_criteria?.complete ?? 0
  const acceptanceCriteriaTotal = progress?.acceptance_criteria?.total ?? 0
  const overallTotal = ksbTotal + acceptanceCriteriaTotal
  const overallProgress = overallTotal === 0
    ? 0
    : Math.round(((ksbEvidenced + acceptanceCriteriaComplete) / overallTotal) * 100)

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
          <section className="panel overall-progress" aria-label="Overall progress summary">
            <div className="overall-progress-heading">
              <div>
                <h2>Overall progress</h2>
                <p>Combined KSB evidence and completed acceptance criteria.</p>
              </div>
              <strong>{overallProgress}% complete</strong>
            </div>
            <ProgressBar label="Overall progress" value={overallProgress} />
          </section>

          <section className="metric-grid" aria-label="Progress metrics">
            <Metric label="Tasks" value={tasks.length} detail={`${completedTasks} completed`} />
            <Metric
              label="KSB evidence"
              value={`${progress?.ksbs?.percentage ?? 0}%`}
              detail={`${ksbEvidenced} of ${ksbTotal} evidenced`}
            />
            <Metric
              label="Acceptance criteria"
              value={`${progress?.acceptance_criteria?.percentage ?? 0}%`}
              detail={`${acceptanceCriteriaComplete} of ${acceptanceCriteriaTotal} complete`}
            />
          </section>

          <section className="panel dashboard-next-step">
            <div>
              <h2>Continue building evidence</h2>
              <p>Open an existing task or create a new one to start the evidence workflow.</p>
            </div>
            <button className="secondary" type="button" onClick={onViewTasks}>View tasks</button>
          </section>

          <section className="panel dashboard-next-step" aria-label="KSB references">
            <div>
              <h2>See your KSBs</h2>
              <p>Browse every KSB and see the tasks whose evidence references it.</p>
            </div>
            <button className="secondary" type="button" onClick={onViewKsbs}>View KSBs</button>
          </section>

          <section className="panel dashboard-next-step" aria-label="Acceptance criteria references">
            <div>
              <h2>See your acceptance criteria</h2>
              <p>Browse pass and distinction criteria, their required KSBs, and linked tasks.</p>
            </div>
            <button className="secondary" type="button" onClick={onViewAcceptanceCriteria}>View acceptance criteria</button>
          </section>
        </>
      )}
    </main>
  )
}

export default DashboardPage
