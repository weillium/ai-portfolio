import { defineAuth } from '@aws-amplify/backend';
import { addUserToGroup } from '../data/add-user-to-group/resource';
import { removeUserFromGroup } from '../data/remove-user-from-group/resource';
import { listUsersInGroup } from '../data/list-users-in-group/resource';
import { listUsers } from '../data/list-users/resource';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { CognitoIdentityProviderClient, ListUsersInGroupCommand, UserType, AttributeType } from "@aws-sdk/client-cognito-identity-provider";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
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
    }
  }, 
  accountRecovery: 'EMAIL_ONLY', 
  access: (allow) => [
    allow.resource(addUserToGroup).to(["addUserToGroup"]),
    allow.resource(removeUserFromGroup).to(["removeUserFromGroup"]),
    allow.resource(listUsersInGroup).to(["listUsersInGroup"]),
    allow.resource(listUsers).to(["listUsers"]),
  ]
});

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const USER_POOL_ID = process.env.USER_POOL_ID || "";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log("Received event:", JSON.stringify(event));

  const groupName = event.queryStringParameters?.groupName;
  if (!groupName) {
    console.log("Missing groupName parameter");
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing groupName parameter" }),
    };
  }

  try {
    const command = new ListUsersInGroupCommand({
      GroupName: groupName,
      UserPoolId: USER_POOL_ID,
    });

    const response = await client.send(command);

    const users = response.Users?.map((user: UserType) => {
      const emailAttr = user.Attributes?.find((attr: AttributeType) => attr.Name === "email");
      return {
        username: user.Username,
        email: emailAttr?.Value,
        status: user.UserStatus,
      };
    }) || [];

    console.log("Returning users:", users);

    return {
      statusCode: 200,
      body: JSON.stringify(users),
    };
  } catch (error) {
    console.error("Error listing users in group", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
