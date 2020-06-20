import React from 'react'
import * as firebase from 'firebase/app'

export default React.createContext<firebase.app.App | undefined>(undefined)
