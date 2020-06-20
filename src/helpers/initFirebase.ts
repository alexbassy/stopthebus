import * as firebase from 'firebase/app'
import { FirebaseOptions } from '@firebase/app-types'

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.FIREBASE_API_KEY,
  projectId: process.env.FIREBASE_PROJECT_ID,
  appId: process.env.FIREBASE_APP_ID,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
}

export default function initFirebase(): firebase.app.App {
  return firebase.initializeApp(firebaseConfig)
}
