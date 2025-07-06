import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { addUserToGroup } from "./add-user-to-group/resource"
import { removeUserFromGroup } from "./remove-user-from-group/resource";
import { listUsersInGroup } from "./list-users-in-group/resource";

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
  addUserToGroup: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      groupName: a.string().required(),
    })
    .authorization((allow) => [
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
    .authorization((allow) => [
      allow.group('admin')
    ])
    .handler(a.handler.function(removeUserFromGroup))
    .returns(a.json()), 
  listUsersInGroup: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      groupName: a.string().required(),
    })
    .authorization((allow) => [
      allow.group('admin')
    ])
    .handler(a.handler.function(listUsersInGroup))
    .returns(a.json()), 
  listUsers: a
    .mutation()
    .arguments({
    })
    .authorization((allow) => [
      allow.group('admin')
    ])
    .handler(a.handler.function(listUsersInGroup))
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
