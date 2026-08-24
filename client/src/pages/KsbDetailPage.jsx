import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function KsbDetailPage({ ksbs, loading, error }) {
  const [statusFilter, setStatusFilter] = useState('All')
  const [codeFilter, setCodeFilter] = useState('')

  const filteredKsbs = useMemo(() => {
    const query = codeFilter.trim().toLowerCase()

    return ksbs.filter(
      (ksb) =>
        (statusFilter === 'All' || ksb.status === statusFilter) &&
        (!query || ksb.code.toLowerCase().includes(query)),
    )
  }, [codeFilter, ksbs, statusFilter])

  return (
    <main className="app-shell">
      <Link className="text-button" to="/">
        ← Dashboard
      </Link>

      <section className="page-heading">
        <div>
          <p className="eyebrow">KSB catalogue</p>
          <h1>KSBs and references</h1>
          <p>See each KSB and the tasks whose evidence references it.</p>
        </div>
      </section>

      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="loading">Loading KSBs…</p>
      ) : (
        <section className="panel">
          <div className="filter-bar">
            <label>
              Filter by KSB code
              <input
                type="search"
                value={codeFilter}
                onChange={(event) => setCodeFilter(event.target.value)}
                placeholder="For example, K1 or S2"
              />
            </label>

            <label>
              Filter by status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>All</option>
                <option>Referenced</option>
                <option>Not referenced</option>
              </select>
            </label>
          </div>

          <div className="table-wrapper">
            <table className="ksb-table">
              <thead>
                <tr>
                  <th scope="col">KSB</th>
                  <th scope="col">Description</th>
                  <th scope="col">Status</th>
                  <th scope="col">Referenced in</th>
                </tr>
              </thead>
              <tbody>
                {filteredKsbs.map((ksb) => (
                  <tr key={ksb.code}>
                    <td>
                      <strong>{ksb.code}</strong>
                    </td>
                    <td>{ksb.description}</td>
                    <td>{ksb.status}</td>
                    <td>
                      {ksb.referencedIn.length === 0 ? (
                        '—'
                      ) : (
                        <div className="task-links">
                          {ksb.referencedIn.map((task) => (
                            <Link key={task.id} to={`/tasks/${task.id}`}>
                              {task.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredKsbs.length === 0 && <p className="empty-state">No KSBs match these filters.</p>}
        </section>
      )}
    </main>
  )
}

export default KsbDetailPage
