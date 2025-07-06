import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

interface User {
  username: string;
  email?: string;
  status?: string;
}

const client = generateClient<Schema>();

function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        // Use Amplify Data client to call listUsers
        const response = await client.mutations.listUsers({});
        const usersList = typeof response.data === "string" ? JSON.parse(response.data) as User[] : response.data as User[];
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
