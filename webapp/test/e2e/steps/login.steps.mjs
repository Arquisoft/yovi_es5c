import { Given, When, Then, After } from '@cucumber/cucumber'
import assert from 'assert'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'

Given('the login page is open', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await page.goto(`${BASE_URL}/login`)
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

//Caso positivo: login correcto
Then('I should be redirected and see a paragraph containing {string}', async function (expected) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  
  // Aparecerá un párrafo indicando que el login fue exitoso
  await page.waitForSelector('h3', { timeout: 5000 })
  const text = await page.textContent('h3')
  assert.ok(text && text.includes(expected), `Expected dashboard message to include "${expected}", got: "${text}"`)
})

//Caso negativo (usuario no registrado o contraseña incorrecta)
Then('I should see an error message containing {string}', async function (expected) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  
  await page.waitForSelector('.MuiAlert-message', { timeout: 5000 })
  const text = await page.textContent('.MuiAlert-message')
  assert.ok(text && text.includes(expected), `Expected error message to include "${expected}", got: "${text}"`)
})

