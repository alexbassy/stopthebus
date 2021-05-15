import path from 'path'
import moduleAlias from 'module-alias'

if (process.env.NODE_ENV === 'production') {
  const shared = path.resolve(`${__dirname}/../../shared/build/`)

  console.log('adding aliases', shared)

  moduleAlias.addAliases({
    shared,
  })
}
