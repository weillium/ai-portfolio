import { defineAuth } from '@aws-amplify/backend';
import { listUsers } from '../functions/list-users/resource';
import { listUserGroups } from '../functions/list-user-groups/resource';
import { addUserToGroup } from '../functions/add-user-to-group/resource';
import { removeUserFromGroup } from '../functions/remove-user-from-group/resource';
import { setUserPassword } from '../functions/set-user-password/resource';
import { resetUserPassword } from '../functions/reset-user-password/resource';
import { deleteUser } from '../functions/delete-user/resource';
import { listGroups } from '../functions/list-groups/resource';

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
  groups: ['admin', 'user'], // Define user groups
  access: (allow) => [
    allow.resource(listUsers).to(["listUsers"]),
    allow.resource(listUserGroups).to(["manageUsers"]),
    allow.resource(deleteUser).to(["manageUsers"]),
    allow.resource(addUserToGroup).to(["manageGroupMembership"]),
    allow.resource(removeUserFromGroup).to(["manageGroupMembership"]), 
    allow.resource(setUserPassword).to(["managePasswordRecovery"]),
    allow.resource(resetUserPassword).to(["managePasswordRecovery"]), 
    allow.resource(listGroups).to(["manageGroups"]), 
  ]
});