import { defineFunction } from '@aws-amplify/backend';

export const removeUserFromGroup = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'remove-user-from-group',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts'
});