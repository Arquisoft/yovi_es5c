import { Given, When, Then, After } from '@cucumber/cucumber'
import assert from 'assert'

// Limpia cookies antes de cada escenario
After(async function () {
  // Busca el botón de logout y haz click
  await this.page.click('#root > div > header > div:nth-child(2) > button')
  await this.page.goto('http://localhost:5173/login')
})

Given('the login page is open', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await page.goto('http://localhost:5173/login')
})

When('I enter {string} as the username and {string} as the password and submit the login', async function (username, password) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  await page.getByLabel('User').fill(username)
  await page.getByLabel('Password').fill(password)
  
  // Click en Log-In
  await page.getByRole('button', { name: 'Log-In' }).click()

  // Espera
  await page.waitForTimeout(1000)
})

Then('I should be redirected and see a paragraph containing {string}', async function (expected) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  
  // Aparecerá un párrafo indicando que el login fue exitoso
  await page.waitForSelector('p', { timeout: 20000 })
  const text = await page.textContent('p')
  assert.ok(text && text.includes(expected), `Expected dashboard message to include "${expected}", got: "${text}"`)
})