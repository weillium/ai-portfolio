import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/list-user-groups';
import { 
  AdminListGroupsForUserCommand,
  CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider';

type Handler = Schema["listUserGroups"]["functionHandler"];
const client = new CognitoIdentityProviderClient();

export const handler: Handler = async (event) => {
  const { userId } = event.arguments;
  const command = new AdminListGroupsForUserCommand({
    Username: userId,
    UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID, 
  })
  const response = await client.send(command);
  return response
}