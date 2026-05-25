/**
 * Maps Firebase Auth error codes to actionable messages.
 * auth/configuration-not-found → Authentication not enabled in Firebase Console.
 */
export function getFriendlyAuthError(error) {
  const code = error?.code || '';
  const message = error?.message || '';

  switch (code) {
    case 'auth/configuration-not-found':
      return (
        'Firebase Authentication is not set up for this project. ' +
        'In Firebase Console → Build → Authentication, click Get started, then enable ' +
        'Email/Password under Sign-in method and Save.'
      );
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.';
    default:
      if (message.includes('CONFIGURATION_NOT_FOUND')) {
        return getFriendlyAuthError({ code: 'auth/configuration-not-found' });
      }
      return message || 'Authentication failed. Please try again.';
  }
}
