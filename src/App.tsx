import React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import Home from './pages/Home'
import Game from './pages/Game'
import Themed from './components/Themed'

function App() {
  return (
    <Themed>
      <Router>
        <Switch>
          <Route exact path='/'>
            <Home />
          </Route>
          <Route path='/game/:gameID'>
            <Game />
          </Route>
        </Switch>
      </Router>
    </Themed>
  )
}

export default App
