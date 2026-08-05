export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAE5PbjUhjcAnsaqlpDtYEgTJoqPOy2D14',
  authDomain: 'rooted-59912.firebaseapp.com',
  projectId: 'rooted-59912',
  storageBucket: 'rooted-59912.firebasestorage.app',
  messagingSenderId: '269052006423',
  appId: '1:269052006423:web:6dc8dc7ad53fac43614c52',
  measurementId: 'G-37R6EX5HG8',
} as const;

export const BACKEND_API_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_API_BASE_URL ?? 'http://127.0.0.1:3333';
