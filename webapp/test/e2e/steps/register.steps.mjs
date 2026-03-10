import { Given, When, Then } from '@cucumber/cucumber'

Given('An unregistered user', async function () {
  this.username = `user_${Date.now()}`
  this.password = 'Password123!'

  await this.page.goto('http://localhost:5173/register')
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
  await this.page.waitForSelector('button:has-text("Start Playing")', { timeout: 15000 })
})