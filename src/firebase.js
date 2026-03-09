import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyAkerGpCV39eYkc0nCJeBzdp5t-sTYVo20",
  authDomain: "forms-cs-278f6.firebaseapp.com",
  projectId: "forms-cs-278f6",
  storageBucket: "forms-cs-278f6.firebasestorage.app",
  messagingSenderId: "473179803405",
  appId: "1:473179803405:web:21d00428d4e11a0528aa44",
  measurementId: "G-NJ23ME40T4",
  databaseURL: "https://forms-cs-278f6-default-rtdb.firebaseio.com"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
