import { setWorldConstructor, Before, After, setDefaultTimeout } from '@cucumber/cucumber'
import { chromium } from 'playwright'

setDefaultTimeout(60_000)

class CustomWorld {
  browser = null
  page = null
}

setWorldConstructor(CustomWorld)

Before(async function () {
  // Allow turning off headless mode and enabling slow motion/devtools via env vars
  const headless = false
  const slowMo = 500
  const devtools = false

  this.browser = await chromium.launch({ headless, slowMo, devtools })
  this.page = await this.browser.newPage()

  await this.page.addInitScript(() => {
    window.localStorage.setItem('i18nextLng', 'en')
  })
})

After(async function () {
  if (this.page) await this.page.close()
  if (this.browser) await this.browser.close()
})
