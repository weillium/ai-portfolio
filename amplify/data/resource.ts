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
  // MAIN PORTFOLIO PROJECTS MODEL
  Projects: a
    .model({
      project_name: a.string().required(),
      project_description: a.string(),
      project_icon: a.string(),
      project_component: a.string(),
      show_project: a.boolean(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['read']),
      allow.group('admin').to(['read', 'create', 'update', 'delete']),
    ]),
  
  // USER MANAGEMENT ACTIONS
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
  
  // JETBLUE 25 FOR 25 MODELS
  JetblueAirports: a
    .model({
      airport_id: a.id().required(),
      airport_name: a.string().required(),
      airport_code: a.string().required(),
      airport_city: a.string().required(),
      airport_state: a.string().required(),
      airport_country: a.string().required(),
      airport_latitude: a.float().required(),
      airport_longitude: a.float().required(),
      user_airports: a.hasMany('JetblueUserAirports', 'airport_id'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.group('admin').to(['read', 'create', 'update', 'delete']),
    ])
    .identifier(['airport_id']),
  
  JetblueUserPreferences: a
    .model({
      user_preference_id: a.id().required(),
      user_id: a.id().required(),
      home_airport_id: a.id().required(),
      member_id: a.string(),
      preferred_flight_class: a.enum(['blue_basic', 'blue', 'blue_plus', 'blue_extra', 'mint']),
      airports_visited: a.integer().default(0),
      total_spend_usd: a.float().default(0),
      user_queries: a.hasMany('JetblueUserQueries', 'user_id'),
      user_trip_subscriptions: a.hasMany('JetblueUserTripSubscriptions', 'user_id'),
      user_airports: a.hasMany('JetblueUserAirports', 'user_id'),
      user_flights: a.hasMany('JetblueUserFlights', 'user_id'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']), 
      allow.owner().to(['create', 'read', 'update']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ])
    .identifier(['user_preference_id']),
    
  JetblueUserAirports: a
    .model({
      user_airport_id: a.id().required(),
      airport_id: a.id().required(),
      user_id: a.id().required(),
      visited: a.boolean().default(false),
      first_visit_date: a.date(),
      last_visit_date: a.date(),
      visit_count: a.integer().default(0),
      jetblue_airport: a.belongsTo('JetblueAirports', 'airport_id'),
      user: a.belongsTo('JetblueUserPreferences', 'user_id'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']), 
      allow.owner().to(['create', 'read', 'update']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ])
    .identifier(['user_airport_id']),
  
  JetblueUserTrips: a
    .model({
      trip_id: a.id().required(),
      trip_name: a.string().required(),
      trip_start_date: a.date().required(),
      trip_end_date: a.date().required(),
      trip_cost_usd: a.float().default(0),
      trip_status: a.enum(['created', 'confirmed', 'in_progress', 'completed', 'cancelled']),
      user_subscriptions: a.hasMany('JetblueUserTripSubscriptions', 'trip_id'),
      lodgings: a.hasMany('JetblueUserTripLodgings', 'trip_id'),
      transportations: a.hasMany('JetblueUserTripTransportations', 'trip_id'),
      flights: a.hasMany('JetblueUserFlights', 'trip_id'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']), 
      allow.owner().to(['create', 'read', 'update']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ])
    .identifier(['trip_id']),

  JetblueUserTripSubscriptions: a
    .model({
      trip_subscription_id: a.id().required(),
      trip_id: a.id().required(),
      user_id: a.id().required(),
      jetblue_trip: a.belongsTo('JetblueUserTrips', 'trip_id'),
      user: a.belongsTo('JetblueUserPreferences', 'user_id'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']), 
      allow.owner().to(['create', 'read', 'update']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ])
    .identifier(['trip_subscription_id']),

  JetblueUserTripLodgings: a
    .model({
      trip_lodging_id: a.id().required(),
      trip_id: a.id().required(),
      lodging_name: a.string().required(),
      lodging_address: a.string().required(),
      lodging_city: a.string().required(),
      lodging_state: a.string().required(),
      lodging_country: a.string().required(),
      lodging_checkin_date: a.date().required(),
      lodging_checkout_date: a.date().required(),
      lodging_room_type: a.enum(['single', 'double', 'suite', 'other']),
      lodging_beds: a.integer().required(),
      lodging_cost_usd: a.float().required(),
      lodging_status: a.enum(['created', 'confirmed', 'in_progress', 'completed', 'cancelled']),
      lodging_confirmation_number: a.string(),
      trip: a.belongsTo('JetblueUserTrips', 'trip_id'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']), 
      allow.owner().to(['create', 'read', 'update']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ])
    .identifier(['trip_lodging_id']),

  JetblueUserTripTransportations: a
    .model({
      trip_transportation_id: a.id().required(),
      trip_id: a.id().required(),
      transportation_type: a.enum(['car_rental', 'public_transportation', 'rideshare', 'other']),
      transportation_company: a.string().required(),
      transportation_pickup_location: a.string().required(),
      transportation_dropoff_location: a.string().required(),
      transportation_pickup_date: a.date().required(),
      transportation_dropoff_date: a.date().required(),
      transportation_cost_usd: a.float().required(),
      transportation_status: a.enum(['created', 'confirmed', 'in_progress', 'completed', 'cancelled']),
      transportation_confirmation_number: a.string(),
      trip: a.belongsTo('JetblueUserTrips', 'trip_id'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']), 
      allow.owner().to(['create', 'read', 'update']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ])
    .identifier(['trip_transportation_id']),
    
  JetblueUserFlights: a
    .model({
      user_flight_id: a.id().required(),
      user_id: a.id().required(),
      trip_id: a.id().required(),
      starting_airport_code: a.string().required(),
      destination_airport_code: a.string().required(),
      flight_number: a.string().required(),
      flight_date: a.date().required(),
      flight_departure_time: a.string().required(),
      flight_arrival_time: a.string().required(),
      flight_class: a.string().required(),
      flight_duration: a.integer().required(),
      flight_cost_usd: a.float().required(),
      flight_status: a.enum(['created', 'confirmed', 'in_progress', 'completed', 'cancelled']),
      flight_confirmation_number: a.string(),
      trip: a.belongsTo('JetblueUserTrips', 'trip_id'),
      user: a.belongsTo('JetblueUserPreferences', 'user_id'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']), 
      allow.owner().to(['create', 'read', 'update']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ])
    .identifier(['user_flight_id']),

  JetblueUserQueries: a
    .model({
      user_query_id: a.id().required(),
      user_id: a.id().required(),
      query_text: a.string().required(),
      query_date: a.date().required(),
      query_response: a.string(),
      query_status: a.enum(['created', 'in_progress', 'completed', 'failed']),
      user: a.belongsTo('JetblueUserPreferences', 'user_id'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ]),
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
