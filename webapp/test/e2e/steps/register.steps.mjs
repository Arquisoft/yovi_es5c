import { Given, When, Then } from '@cucumber/cucumber'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'

//Caso positivo: registro exitoso
Given('An unregistered user', async function () {
  this.username = `user_${Date.now()}`
  this.password = 'Password123!'

  await this.page.goto(`${BASE_URL}/register`)
})

When('I fill the data in the form and press submit', async function () {
  await this.page.fill('input[name="username"]', this.username)
  await this.page.fill('input[name="name"]', 'Admin')
  await this.page.fill('input[name="surname"]', 'Admin')
  await this.page.fill('input[name="email"]', `${this.username}@test.com`)
  await this.page.fill('input[name="password"]', this.password)
  await this.page.fill('input[name="confirmPassword"]', this.password)

  await this.page.click('button:has-text("Register")')
})

Then('I should be redirect to the homepage', async function () {
  await this.page.waitForURL('**/homepage', { timeout: 15000 })
  await this.page.waitForSelector('button:has-text("Play")', { timeout: 15000 })
})

//Caso negativo: intento registrar usuario ya existente
Given('the register page is open', async function () {
  await this.page.goto(`${BASE_URL}/register`)
})

When('I fill the form with an already registered username', async function () {
  await this.page.fill('input[name="username"]', 'Alice')
  await this.page.fill('input[name="name"]', 'Alice')
  await this.page.fill('input[name="surname"]', 'Alice')
  await this.page.fill('input[name="email"]', 'alice@test.com')
  await this.page.fill('input[name="password"]', 'Alice123**')
  await this.page.fill('input[name="confirmPassword"]', 'Alice123**')
  await this.page.click('button:has-text("Register")')
})