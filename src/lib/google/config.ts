/**
 * OAuth client for the "Novel Writing" Google Cloud project. Client IDs are not
 * secrets — they ship in every browser app. Access is restricted by the
 * authorized JavaScript origins configured on the client, and by the scope below.
 *
 * `drive.file` lets the app see only the files and folders it created itself.
 */
export const GOOGLE_CLIENT_ID =
  '1069336477771-08gtk9b2kunom0e4lbv80d5lu05kjf7s.apps.googleusercontent.com';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
