import React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import Home from './pages/Home'
import Game from './pages/Game'
import Acknowledgements from './pages/Acknowledgements'
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
          <Route path='/acknowledgements'>
            <Acknowledgements />
          </Route>
        </Switch>
      </Router>
    </Themed>
  )
}

export default App
