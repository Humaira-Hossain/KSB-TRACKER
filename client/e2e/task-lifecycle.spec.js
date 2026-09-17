import { expect, test } from '@playwright/test'

test('creates, edits, archives, and restores a task', async ({ page }) => {
  const title = `E2E task ${Date.now()}`

  await page.goto('/')
  await page.getByRole('button', { name: 'Create task' }).click()
  await page.getByRole('textbox', { name: 'Task title' }).fill(title)
  await page.getByRole('textbox', { name: 'Rough notes' }).fill('Initial E2E rough notes.')
  await page.getByRole('button', { name: 'Save task' }).click()

  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await page.getByRole('button', { name: 'Edit rough notes' }).click()
  await page.getByRole('textbox', { name: 'Rough notes' }).fill('Updated E2E rough notes.')
  await page.getByRole('button', { name: 'Save rough notes' }).click()
  await expect(page.getByText('Rough notes saved.')).toBeVisible()

  await page.getByRole('button', { name: 'Archive task' }).click()
  await expect(page).toHaveURL(/\/tasks$/)
  await page
    .getByRole('region', { name: 'Archived tasks' })
    .getByRole('button', { name: title })
    .click()
  await page.getByRole('button', { name: 'Unarchive task' }).click()
  await expect(page.getByRole('button', { name: 'Archive task' })).toBeVisible()
})

test('marks a task complete and allows it to be reopened', async ({ page }) => {
  const title = `E2E completed task ${Date.now()}`

  await page.goto('/')
  await page.getByRole('button', { name: 'Create task' }).click()
  await page.getByRole('textbox', { name: 'Task title' }).fill(title)
  await page.getByRole('textbox', { name: 'Rough notes' }).fill('Notes for a completed task.')
  await page.getByRole('button', { name: 'Save task' }).click()

  await page.getByRole('button', { name: 'Mark task complete' }).click()
  await expect(page.getByRole('button', { name: 'Reopen task' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create evidence' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Edit rough notes' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Reopen task' }).click()
  await expect(page.getByRole('button', { name: 'Edit rough notes' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create evidence' })).toBeEnabled()
})

test('creates, manually links, approves, and deletes evidence', async ({ page }) => {
  const title = `E2E evidence task ${Date.now()}`

  await page.goto('/')
  await page.getByRole('button', { name: 'Create task' }).click()
  await page.getByRole('textbox', { name: 'Task title' }).fill(title)
  await page.getByRole('textbox', { name: 'Rough notes' }).fill('Notes used to create evidence.')
  await page.getByRole('button', { name: 'Save task' }).click()

  await page.getByRole('button', { name: 'Create evidence' }).click()
  await expect(page.getByRole('textbox', { name: 'Evidence title' })).toBeVisible()

  await page.getByLabel('Add KSB').selectOption({ index: 1 })
  await page.getByRole('button', { name: 'Add KSB' }).click()
  await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible()

  await page.getByRole('button', { name: 'Approve evidence' }).click()
  await expect(page.getByRole('button', { name: 'Evidence approved' })).toBeVisible()

  await page.getByRole('button', { name: 'Delete evidence' }).click()
  await expect(
    page.getByText('No evidence yet. Create an evidence item to start the STAR workflow.'),
  ).toBeVisible()
})
