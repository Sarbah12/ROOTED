/**
 * Minimal Firebase web-config shape needed to host the reCAPTCHA widget.
 * Matches the object exported from constants/firebase.ts.
 */
export type FirebaseWebOptions = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  databaseURL?: string;
};

/**
 * The contract Firebase Auth expects from an application verifier.
 * See firebase-js-sdk `ApplicationVerifier`.
 */
export interface FirebaseAuthApplicationVerifier {
  readonly type: string;
  verify(): Promise<string>;
}
