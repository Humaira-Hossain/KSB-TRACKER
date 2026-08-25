import { useState } from 'react'

function TaskNotesEditor({ rawNotes, saving, onSave }) {
  const [notes, setNotes] = useState(rawNotes)
  const [isEditing, setIsEditing] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    onSave(notes)
  }

  return (
    <form className="panel task-notes" onSubmit={handleSubmit}>
      <h2>Rough notes</h2>
      <label>
        Rough notes
        <textarea
          rows="8"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add more bullets, reminders, decisions, and outcomes as you go."
          disabled={!isEditing}
          required
        />
      </label>
      <div className="form-actions">
        {isEditing ? (
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save rough notes'}
          </button>
        ) : (
          <button type="button" onClick={() => setIsEditing(true)}>
            Edit rough notes
          </button>
        )}
      </div>
    </form>
  )
}

export default TaskNotesEditor
