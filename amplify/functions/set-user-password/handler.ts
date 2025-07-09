import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/set-user-password';
import { 
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider';

type Handler = Schema["setUserPassword"]["functionHandler"];
const client = new CognitoIdentityProviderClient();

export const handler: Handler = async (event) => {
  const { userId, password, permanent } = event.arguments;
  const command = new AdminSetUserPasswordCommand({
    Username: userId,
    Password: password,
    Permanent: permanent ?? false,
    UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID, 
  })
  const response = await client.send(command);
  return response
}