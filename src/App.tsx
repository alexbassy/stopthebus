import React, { useState } from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import Firebase from './contexts/FirebaseContext'
import Home from './pages/Home'
import Game from './pages/Game'
import initFirebase from './helpers/initFirebase'
import * as firebase from 'firebase'

function App() {
  const [firebaseClient, setFirebaseClient] = useState<
    firebase.app.App | undefined
  >()

  React.useEffect(() => {
    setFirebaseClient(initFirebase())
  }, [])

  return (
    <Firebase.Provider value={firebaseClient}>
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
    </Firebase.Provider>
  )
}

export default App
