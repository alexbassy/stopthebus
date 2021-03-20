module.exports = (config) => {
  // Let Babel compile outside of src/.
  const tsRule = config.module.rules[1].oneOf[2]
  tsRule.include = undefined
  tsRule.exclude = /node_modules/

  return config
}
