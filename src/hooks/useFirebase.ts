import { useContext } from 'react'
import * as firebase from 'firebase/app'
import FirebaseContext from '../contexts/FirebaseContext'

export function useFirebase() {
  const firebase = useContext(FirebaseContext)
  return firebase
}

export function useGame() {
  const firebase = useFirebase()
  return firebase
}
