import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

Given('the login page is open', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  // Suponiendo que tu ruta de login es /login
  await page.goto('http://localhost:5173/login')
})

When('I enter {string} as the username and {string} as the password and submit the login', async function (username, password) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  
  await page.fill('input[name="username"]', username)
  await page.fill('input[name="password"]', password)
  
  // Ajusta la clase o ID según tu botón de login real
  await page.click('button[type="submit"]') 
})

Then('I should be redirected and see a dashboard message containing {string}', async function (expected) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  
  // Ajusta el selector a un elemento que solo aparezca después de hacer login
  await page.waitForSelector('.dashboard-message', { timeout: 5000 })
  const text = await page.textContent('.dashboard-message')
  assert.ok(text && text.includes(expected), `Expected dashboard message to include "${expected}", got: "${text}"`)
})