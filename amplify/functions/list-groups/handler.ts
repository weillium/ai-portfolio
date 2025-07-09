import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/list-groups';
import { 
  ListGroupsCommand,
  CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider';

type Handler = Schema["listGroups"]["functionHandler"];
const client = new CognitoIdentityProviderClient();

export const handler: Handler = async () => {
  // const { } = event.arguments;
  const command = new ListGroupsCommand({
    UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID, 
  })
  const response = await client.send(command);
  return response
}