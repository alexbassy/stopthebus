import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Route, Switch } from 'wouter'

import './styles/globals.css'
import Acknowledgements from './pages/acknowledgements'
import Game from './pages/game'
import Home from './pages/home'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Switch>
      <Route path='/' component={Home} />
      <Route path='/acknowledgements' component={Acknowledgements} />
      <Route path='/game/:id' component={Game} />
      <Route>Not found</Route>
    </Switch>
  </StrictMode>,
)
