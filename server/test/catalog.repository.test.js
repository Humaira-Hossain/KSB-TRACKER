import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import { pool } from '../src/db.js'
import { listAcceptanceCriteria } from '../src/repositories/catalog.repository.js'

const originalQuery = pool.query

afterEach(() => {
  pool.query = originalQuery
})

test('listAcceptanceCriteria includes the same completion requirements as progress', async () => {
  let queryText = ''
  pool.query = async (text) => {
    queryText = text
    return { rows: [] }
  }

  await listAcceptanceCriteria()

  assert.match(queryText, /AS is_complete/)
  assert.match(queryText, /eac\.review_status = 'accepted'/)
  assert.match(queryText, /t\.status = 'completed'/)
  assert.match(queryText, /acceptance_criteria_ksbs/)
})
