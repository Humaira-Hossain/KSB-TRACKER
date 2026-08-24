import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function AcceptanceCriteriaPage({ criteria, loading, error }) {
  const [codeFilter, setCodeFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('All levels')
  const [statusFilter, setStatusFilter] = useState('All statuses')

  const levels = useMemo(
    () => [...new Set(criteria.map((criterion) => criterion.level).filter(Boolean))].sort(),
    [criteria],
  )
  const statuses = useMemo(
    () => [...new Set(criteria.map((criterion) => criterion.status))].sort(),
    [criteria],
  )
  const filteredCriteria = useMemo(() => {
    const query = codeFilter.trim().toLowerCase()

    return criteria.filter((criterion) => (
      (levelFilter === 'All levels' || criterion.level === levelFilter)
      && (statusFilter === 'All statuses' || criterion.status === statusFilter)
      && (!query || criterion.code.toLowerCase().includes(query))
    ))
  }, [codeFilter, criteria, levelFilter, statusFilter])

  return (
    <main className="app-shell">
      <Link className="text-button" to="/">← Dashboard</Link>

      <section className="page-heading">
        <div>
          <p className="eyebrow">AC catalogue</p>
          <h1>Acceptance criteria and references</h1>
          <p>See pass and distinction criteria, their required KSBs, and linked task evidence.</p>
        </div>
      </section>

      {error && <p className="message error" role="alert">{error}</p>}

      {loading ? <p className="loading">Loading acceptance criteria…</p> : (
        <section className="panel">
          <div className="filter-bar ac-filter-bar">
            <label>
              Filter by AC code
              <input
                type="search"
                value={codeFilter}
                onChange={(event) => setCodeFilter(event.target.value)}
                placeholder="For example, AC03"
              />
            </label>

            <label>
              Filter by level
              <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
                <option>All levels</option>
                {levels.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>

            <label>
              Filter by evidence status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option>All statuses</option>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
          </div>

          <div className="table-wrapper">
            <table className="ac-table">
              <thead>
                <tr>
                  <th scope="col">Criterion</th>
                  <th scope="col">Description</th>
                  <th scope="col">Level</th>
                  <th scope="col">Evidence status</th>
                  <th scope="col">Required KSBs</th>
                  <th scope="col">Referenced in</th>
                </tr>
              </thead>
              <tbody>
                {filteredCriteria.map((criterion) => (
                  <tr key={criterion.code}>
                    <td><strong>{criterion.code}</strong></td>
                    <td>{criterion.description}</td>
                    <td>{criterion.level || '—'}</td>
                    <td>{criterion.status}</td>
                    <td>{criterion.ksb_codes?.join(', ') || '—'}</td>
                    <td>
                      {criterion.referencedIn.length === 0 ? '—' : (
                        <div className="task-links">
                          {criterion.referencedIn.map((task) => (
                            <Link key={task.id} to={`/tasks/${task.id}`}>{task.title}</Link>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCriteria.length === 0 && <p className="empty-state">No acceptance criteria match these filters.</p>}
        </section>
      )}
    </main>
  )
}

export default AcceptanceCriteriaPage
