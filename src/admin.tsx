import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

interface User {
  username: string;
  email?: string;
  groups?: string[];
  lastUpdated?: string;
}

interface CognitoUser {
  Username: string;
  Attributes?: { Name: string; Value: string }[];
  UserStatus?: string;
  UserLastModifiedDate?: string;
}

interface ListUsersResponse {
  Users?: CognitoUser[];
  [key: string]: unknown;
}

interface ListUserGroupsResponse {
  Groups?: { GroupName: string }[];
  [key: string]: unknown;
}

const client = generateClient<Schema>();

function isListUsersResponse(data: unknown): data is ListUsersResponse {
  if (typeof data === "object" && data !== null) {
    const d = data as ListUsersResponse;
    return Array.isArray(d.Users);
  }
  return false;
}

function isListUserGroupsResponse(data: unknown): data is ListUserGroupsResponse {
  if (typeof data === "object" && data !== null) {
    const d = data as ListUserGroupsResponse;
    return Array.isArray(d.Groups);
  }
  return false;
}

function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const response = await client.mutations.listUsers({});

        let dataObj = response.data;
        if (typeof dataObj === "string") {
          try {
            dataObj = JSON.parse(dataObj);
          } catch {
            dataObj = {};
          }
        }

        let usersList: User[] = [];

        if (isListUsersResponse(dataObj)) {
          // Fetch groups for each user
          const usersWithGroups = await Promise.all(
            dataObj.Users!.map(async (cUser) => {
              const emailAttr = cUser.Attributes?.find(attr => attr.Name === "email");
              const preferredUsernameAttr = cUser.Attributes?.find(attr => attr.Name === "preferred_username");
              const groupsResponse = await client.mutations.listUserGroups({ userId: cUser.Username });
              console.log("Groups response for user", cUser.Username, ":", groupsResponse);
              let groupsData = groupsResponse.data;
              if (typeof groupsData === "string") {
                try {
                  groupsData = JSON.parse(groupsData);
                } catch {
                  groupsData = {};
                }
              }
              console.log("Groups response data for user", cUser.Username, ":", groupsData);
              let groups: string[] = [];
              if (isListUserGroupsResponse(groupsData)) {
                groups = groupsData.Groups!.map(g => g.GroupName);
              }
              console.log(`Mapped groups for user ${cUser.Username}:`, groups);
              const userObj = {
                username: preferredUsernameAttr?.Value ?? cUser.Username,
                email: emailAttr?.Value,
                groups,
                lastUpdated: cUser.UserLastModifiedDate,
              };
              console.log(`User object for ${cUser.Username}:`, userObj);
              return userObj;
            })
          );
          usersList = usersWithGroups;
        } else {
          usersList = [];
        }

        setUsers(usersList);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to fetch users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>User Management</h2>
      {loading && <p>Loading users...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid black", padding: "0.5rem" }}>Username</th>
              <th style={{ border: "1px solid black", padding: "0.5rem" }}>Email</th>
              <th style={{ border: "1px solid black", padding: "0.5rem" }}>Groups</th>
              <th style={{ border: "1px solid black", padding: "0.5rem" }}>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.username}>
                <td style={{ border: "1px solid black", padding: "0.5rem" }}>{user.username}</td>
                <td style={{ border: "1px solid black", padding: "0.5rem" }}>{user.email ?? "-"}</td>
                <td style={{ border: "1px solid black", padding: "0.5rem" }}>{user.groups?.join(", ") ?? "-"}</td>
                <td style={{ border: "1px solid black", padding: "0.5rem" }}>{user.lastUpdated ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Admin;
