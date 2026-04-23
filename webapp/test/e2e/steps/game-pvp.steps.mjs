import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'

async function waitForPlayerTurn(page, playerTestId) {
  await page.waitForFunction(
    (testId) => document.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() === 'Turn',
    playerTestId,
    { timeout: 15000 },
  )
}

Given('a logged in game player', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  const username = `game_${Date.now()}`
  const password = 'Password123!'

  await page.goto(`${BASE_URL}/register`)
  await page.fill('input[name="username"]', username)
  await page.fill('input[name="name"]', 'Game')
  await page.fill('input[name="surname"]', 'Player')
  await page.fill('input[name="email"]', `${username}@test.com`)
  await page.fill('input[name="password"]', password)
  await page.fill('input[name="confirmPassword"]', password)
  await page.click('button:has-text("Register")')
  await page.waitForURL('**/homepage', { timeout: 15000 })
})

Given('a small board size is selected', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  await page.evaluate(() => {
    window.sessionStorage.setItem('boardSize', '3')
  })
})

Given('the game setup page is open', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  await page.getByRole('button', { name: /Play/i }).click()
  await page.getByTestId('start-pvp-game').waitFor({ state: 'visible', timeout: 15000 })
})

When('I start a Player vs Player game', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  await page.getByTestId('start-pvp-game').click()
})

Then('I should see the Player vs Player board', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  await page.getByRole('heading', { name: /Game Y - Player vs Player/i }).waitFor({ state: 'visible', timeout: 15000 })
  await page.locator('svg[aria-label="Y game board"]').waitFor({ state: 'visible', timeout: 15000 })

  const cells = await page.locator('[data-testid^="cell-"]').count()
  assert.equal(cells, 6, `Expected a size 3 board to have 6 cells, got ${cells}`)
})

Then('it should be Player 1 turn', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  await waitForPlayerTurn(page, 'player-1-status')
})

Then('it should be Player 2 turn', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  await waitForPlayerTurn(page, 'player-2-status')
})

When('Player 1 places a piece on cell {string}', async function (cell) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  await page.getByTestId(`cell-${cell}`).click()
})

When('Player 2 places a piece on cell {string}', async function (cell) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  await page.getByTestId(`cell-${cell}`).click()
})

Then('Player 1 should win the game', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  await page.getByRole('heading', { name: 'Player B wins!' }).waitFor({ state: 'visible', timeout: 15000 })
  await page.getByText('The game has ended. Player blue wins.').waitFor({ state: 'visible', timeout: 15000 })
})
