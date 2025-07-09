import { defineFunction } from '@aws-amplify/backend';

export const addUserToGroup = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'add-user-to-group',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts'
});