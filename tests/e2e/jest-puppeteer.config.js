const VIEWPORTS = {
  IPAD: [768, 1024],
  IPHONE_X: [375, 950],
}

module.exports = {
  launch: {
    headless: false,
    slowMo: 300,
    args: [`--window-size=${VIEWPORTS.IPHONE_X.join(',')}`],
  },
}
