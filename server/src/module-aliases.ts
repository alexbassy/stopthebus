import moduleAlias from 'module-alias'

if (process.env.NODE_ENV === 'production') {
  moduleAlias.addAliases({
    shared: `${__dirname}/shared/build/`,
  })
}
