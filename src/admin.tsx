import React, { useEffect, useState } from "react";
import { CognitoIdentityProviderClient, ListUsersInGroupCommand, UserType } from "@aws-sdk/client-cognito-identity-provider";

interface User {
  username: string;
  email?: string;
  status?: string;
}

const client = new CognitoIdentityProviderClient({ region: "us-east-1" }); // Adjust region as needed
const USER_POOL_ID = "your_user_pool_id_here"; // Replace with your Cognito User Pool ID

async function listUsersInGroup(groupName: string): Promise<User[]> {
  const command = new ListUsersInGroupCommand({
    GroupName: groupName,
    UserPoolId: USER_POOL_ID,
  });

  try {
    const response = await client.send(command);
    const users = response.Users?.map((user: UserType) => {
      const emailAttr = user.Attributes?.find((attr) => attr.Name === "email");
      return {
        username: user.Username ?? "",
        email: emailAttr?.Value,
        status: user.UserStatus,
      };
    }) ?? [];
    return users;
  } catch (error) {
    console.error("Error listing users in group", error);
    throw error;
  }
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
        const usersList = await listUsersInGroup("admin"); // Use your actual group name here
        setUsers(usersList);
      } catch (err) {
        setError("Failed to fetch users");
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
              <th style={{ border: "1px solid black", padding: "0.5rem" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.username}>
                <td style={{ border: "1px solid black", padding: "0.5rem" }}>{user.username}</td>
                <td style={{ border: "1px solid black", padding: "0.5rem" }}>{user.email ?? "-"}</td>
                <td style={{ border: "1px solid black", padding: "0.5rem" }}>{user.status ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Admin;
