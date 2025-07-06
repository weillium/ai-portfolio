import { defineAuth } from '@aws-amplify/backend';
import { listUsers } from '../functions/list-users/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  accountRecovery: 'EMAIL_ONLY',
  userAttributes: {
    // Maps to Cognito standard attribute 'name'
    fullname: {
      mutable: true,
      required: false,
    },
    // Maps to Cognito standard attribute 'picture'
    profilePicture: {
      mutable: true,
      required: false,
    },
    // Maps to Cognito standard attribute 'preferred_username'
    preferredUsername: {
      mutable: true,
      required: false,
    },
    // Maps to Cognito standard attribute 'updated_at'
    lastUpdateTime: {
      mutable: true,
      required: false,
    },
  },
  access: (allow) => [
    allow.resource(listUsers).to(["listUsers"]),
  ]
});