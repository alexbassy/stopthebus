import 'expect-puppeteer'

const IPHONE_X = [375, 812]
const URL = 'http://localhost:3000'

const selectors = {
  newGame: '[data-qa="create-game"]',
}

describe('end-to-end', () => {
  beforeAll(() => {
    jest.setTimeout(20 * 1000)
  })

  it('opens new game', async () => {
    await page.setViewport({ width: IPHONE_X[0], height: IPHONE_X[1] })
    await page.goto(URL)
    await page.waitForSelector(selectors.newGame)
    await page.click(selectors.newGame)
    await page.waitFor(3000)
  })
})
