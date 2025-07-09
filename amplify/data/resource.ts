import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { listUsers } from "../functions/list-users/resource";
import { listUserGroups } from "../functions/list-user-groups/resource";
import { addUserToGroup } from "../functions/add-user-to-group/resource";
import { removeUserFromGroup } from "../functions/remove-user-from-group/resource";
import { setUserPassword } from "../functions/set-user-password/resource";
import { resetUserPassword } from "../functions/reset-user-password/resource";
import { deleteUser } from "../functions/delete-user/resource";
import { listGroups } from "../functions/list-groups/resource";

const schema = a.schema({
  Projects: a
    .model({
      project_id: a.id(),
      created_on: a.timestamp(),
      updated_on: a.timestamp(),
      project_name: a.string().required(),
      project_description: a.string(),
      project_icon: a.string(),
      project_url: a.url(),
      show_project: a.boolean(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ]),

  listUsers: a
    .mutation()
    .arguments({})
    .authorization(allow => [
      allow.group('admin')
    ])
    .handler(a.handler.function(listUsers))
    .returns(a.json()),

  listUserGroups: a
    .mutation()
    .arguments({
      userId: a.string().required(),
    })
    .authorization(allow => [
      allow.group('admin')
    ])
    .handler(a.handler.function(listUserGroups))
    .returns(a.json()),

  addUserToGroup: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      groupName: a.string().required(),
    })
    .authorization(allow => [
      allow.group('admin')
    ])
    .handler(a.handler.function(addUserToGroup))
    .returns(a.json()), 

  removeUserFromGroup: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      groupName: a.string().required(),
    })
    .authorization(allow => [
      allow.group('admin')
    ])
    .handler(a.handler.function(removeUserFromGroup))
    .returns(a.json()), 

  setUserPassword: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      password: a.string().required(),
      permanent: a.boolean().required(),
    })
    .authorization(allow => [
      allow.group('admin')
    ])
    .handler(a.handler.function(setUserPassword))
    .returns(a.json()), 

  resetUserPassword: a
    .mutation()
    .arguments({
      userId: a.string().required(),
    })
    .authorization(allow => [
      allow.group('admin')
    ])
    .handler(a.handler.function(resetUserPassword))
    .returns(a.json()), 
  
  deleteUser: a
    .mutation()
    .arguments({
      userId: a.string().required(),
    })
    .authorization(allow => [
      allow.group('admin')
    ])
    .handler(a.handler.function(deleteUser))
    .returns(a.json()), 

  listGroups: a
    .mutation()
    .arguments({
      // No arguments needed for listing groups
    })
    .authorization(allow => [
      allow.group('admin')
    ])
    .handler(a.handler.function(listGroups))
    .returns(a.json()), 
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
