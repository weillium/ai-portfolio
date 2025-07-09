import { defineFunction } from '@aws-amplify/backend';

export const setUserPassword = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'set-user-password',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts'
});