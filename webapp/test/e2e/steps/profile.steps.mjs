import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'

Given('a registered profile user', async function () {
  this.profileUsername = `profile_${Date.now()}`
  this.profilePassword = 'Password123!'

  await this.page.goto(`${BASE_URL}/register`)
  await this.page.fill('input[name="username"]', this.profileUsername)
  await this.page.fill('input[name="name"]', 'Profile')
  await this.page.fill('input[name="surname"]', 'User')
  await this.page.fill('input[name="email"]', `${this.profileUsername}@test.com`)
  await this.page.fill('input[name="password"]', this.profilePassword)
  await this.page.fill('input[name="confirmPassword"]', this.profilePassword)
  await this.page.click('button:has-text("Register")')
  await this.page.waitForURL('**/homepage', { timeout: 15000 })
})

Given('the profile page is open', async function () {
  await this.page.goto(`${BASE_URL}/profile`)
  await this.page.getByRole('button', { name: 'Edit profile' }).waitFor({ state: 'visible', timeout: 15000 })
})

When('I update the profile with name {string} surname {string} and email {string}', async function (name, surname, email) {
  await this.page.getByRole('button', { name: 'Edit profile' }).click()
  await this.page.locator('input[name="name"]').fill(name)
  await this.page.locator('input[name="surname"]').fill(surname)
  await this.page.locator('input[name="email"]').fill(email)
  await this.page.getByRole('button', { name: 'Save' }).click()
})

Then('I should see a profile updated confirmation', async function () {
  await this.page.getByText('Profile updated successfully.').waitFor({ state: 'visible', timeout: 15000 })
})

Then('the profile should show name {string} surname {string} and email {string}', async function (name, surname, email) {
  const content = await this.page.locator('body').innerText()

  assert.ok(content.includes(name), `Expected profile page to show name "${name}"`)
  assert.ok(content.includes(surname), `Expected profile page to show surname "${surname}"`)
  assert.ok(content.includes(email), `Expected profile page to show email "${email}"`)
})
