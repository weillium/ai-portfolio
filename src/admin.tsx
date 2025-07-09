import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

interface User {
  username: string; // preferred_username for display
  cognitoUsername: string; // actual Cognito username for admin actions
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

interface ListGroupsResponse {
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

function isListGroupsResponse(data: unknown): data is ListGroupsResponse {
  if (typeof data === "object" && data !== null) {
    const d = data as ListGroupsResponse;
    return Array.isArray(d.Groups);
  }
  return false;
}

interface AdminProps {
  onUserGroupChange?: () => void;
}

function Admin({ onUserGroupChange }: AdminProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showRemoveGroupModal, setShowRemoveGroupModal] = useState(false);
  const [currentUserForGroupAction, setCurrentUserForGroupAction] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [groupActionType, setGroupActionType] = useState<'add' | 'remove' | null>(null);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [permanentFlag, setPermanentFlag] = useState(true);

  async function refreshUsers() {
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
            let groupsData = groupsResponse.data;
            if (typeof groupsData === "string") {
              try {
                groupsData = JSON.parse(groupsData);
              } catch {
                groupsData = {};
              }
            }
            let groups: string[] = [];
            if (isListUserGroupsResponse(groupsData)) {
              groups = groupsData.Groups!.map(g => g.GroupName);
            }
            const userObj: User = {
              username: preferredUsernameAttr?.Value ?? cUser.Username, // For display
              cognitoUsername: cUser.Username, // For admin actions
              email: emailAttr?.Value,
              groups,
              lastUpdated: cUser.UserLastModifiedDate,
            };
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

  async function fetchAvailableGroups() {
    try {
      const response = await client.mutations.listGroups({});
      let dataObj = response.data;
      if (typeof dataObj === "string") {
        try {
          dataObj = JSON.parse(dataObj);
        } catch {
          dataObj = {};
        }
      }
      if (isListGroupsResponse(dataObj)) {
        setAvailableGroups(dataObj.Groups!.map(g => g.GroupName));
      } else {
        setAvailableGroups([]);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      setAvailableGroups([]);
    }
  }

  useEffect(() => {
    refreshUsers();
    fetchAvailableGroups();
  }, []);

  async function handleResetPassword(cognitoUsername: string) {
    const user = users.find(u => u.cognitoUsername === cognitoUsername);
    const displayName = user?.username ?? cognitoUsername;
    try {
      await client.mutations.resetUserPassword({ userId: cognitoUsername });
      alert(`Password reset requested for user ${displayName}.`);
    } catch (error) {
      console.error("Failed to reset password:", error);
      alert(`Failed to reset password for user ${displayName}.`);
    }
  }

  async function handleSetPasswordSubmit() {
    if (!currentUserForGroupAction) return;
    const user = users.find(u => u.cognitoUsername === currentUserForGroupAction);
    const displayName = user?.username ?? currentUserForGroupAction;
    if (!passwordInput) {
      alert("Password cannot be empty.");
      return;
    }
    try {
      await client.mutations.setUserPassword({ userId: currentUserForGroupAction, password: passwordInput, permanent: permanentFlag });
      alert(`Password set successfully for user ${displayName}.`);
      setShowSetPasswordModal(false);
      setPasswordInput("");
      setCurrentUserForGroupAction(null);
    } catch (error) {
      console.error("Failed to set password:", error);
      alert(`Failed to set password for user ${displayName}.`);
    }
  }

  async function handleAddToGroup(cognitoUsername: string, groupName: string) {
    const user = users.find(u => u.cognitoUsername === cognitoUsername);
    const displayName = user?.username ?? cognitoUsername;
    try {
      console.log(`Adding user ${cognitoUsername} to group ${groupName}`);
      const response = await client.mutations.addUserToGroup({ userId: cognitoUsername, groupName });
      console.log("addUserToGroup response:", response);
      alert(`User ${displayName} added to group ${groupName}.`);
      refreshUsers();
      if (onUserGroupChange) {
        onUserGroupChange();
      }
    } catch (error) {
      console.error("Failed to add user to group:", error);
      alert(`Failed to add user ${displayName} to group ${groupName}.`);
    }
  }

  async function handleRemoveFromGroup(cognitoUsername: string, groupName: string) {
    const user = users.find(u => u.cognitoUsername === cognitoUsername);
    const displayName = user?.username ?? cognitoUsername;
    try {
      await client.mutations.removeUserFromGroup({ userId: cognitoUsername, groupName });
      alert(`User ${displayName} removed from group ${groupName}.`);
      refreshUsers();
      if (onUserGroupChange) {
        onUserGroupChange();
      }
    } catch (error) {
      console.error("Failed to remove user from group:", error);
      alert(`Failed to remove user ${displayName} from group ${groupName}.`);
    }
  }

  async function handleDeleteUser(cognitoUsername: string) {
    const user = users.find(u => u.cognitoUsername === cognitoUsername);
    const displayName = user?.username ?? cognitoUsername;
    if (!window.confirm(`Are you sure you want to delete user ${displayName}? This action cannot be undone.`)) {
      return;
    }
    try {
      await client.mutations.deleteUser({ userId: cognitoUsername });
      alert(`User ${displayName} deleted successfully.`);
      refreshUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert(`Failed to delete user ${displayName}.`);
    }
  }

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
              <th style={{ border: "1px solid black", padding: "0.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.cognitoUsername ?? user.username}>
                <td style={{ border: "1px solid black", padding: "0.5rem" }}>{user.username}</td>
                <td style={{ border: "1px solid black", padding: "0.5rem" }}>{user.email ?? "-"}</td>
                <td style={{ border: "1px solid black", padding: "0.5rem" }}>{user.groups?.join(", ") ?? "-"}</td>
                <td style={{ border: "1px solid black", padding: "0.5rem" }}>{user.lastUpdated ?? "-"}</td>
                <td style={{ border: "1px solid black", padding: "0.5rem", display: "flex", gap: "0.25rem", flexWrap: "wrap", alignItems: "center" }}>
                  <button onClick={() => handleResetPassword(user.cognitoUsername)}>Reset Password</button>
                  <button onClick={() => {
                    setCurrentUserForGroupAction(user.cognitoUsername);
                    setShowSetPasswordModal(true);
                    setPasswordInput("");
                    setPermanentFlag(true);
                  }}>Set Password</button>
                  <button onClick={() => {
                    setCurrentUserForGroupAction(user.cognitoUsername);
                    setGroupActionType('add');
                    setSelectedGroup(null);
                    setShowAddGroupModal(true);
                  }}>Add to Group</button>
                  <button onClick={() => {
                    setCurrentUserForGroupAction(user.cognitoUsername);
                    setGroupActionType('remove');
                    setSelectedGroup(null);
                    setShowRemoveGroupModal(true);
                  }}>Remove from Group</button>
                  <button onClick={() => handleDeleteUser(user.cognitoUsername)}>Delete User</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showAddGroupModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1500 }} onClick={() => setShowAddGroupModal(false)}>
          <div style={{ background: "white", padding: "1rem", borderRadius: "8px", minWidth: "300px" }} onClick={e => e.stopPropagation()}>
            <h3>Select Group to Add</h3>
            <select value={selectedGroup ?? ""} onChange={e => setSelectedGroup(e.target.value)} style={{ width: "100%", marginBottom: "1rem" }}>
              <option value="">-- Select a group --</option>
              {availableGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
            <button disabled={!selectedGroup} onClick={async () => {
              if (currentUserForGroupAction && selectedGroup) {
                await handleAddToGroup(currentUserForGroupAction, selectedGroup);
                setShowAddGroupModal(false);
                setSelectedGroup(null);
                setCurrentUserForGroupAction(null);
              }
            }}>Add</button>
            <button onClick={() => setShowAddGroupModal(false)} style={{ marginLeft: "1rem" }}>Cancel</button>
          </div>
        </div>
      )}

      {showRemoveGroupModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1500 }} onClick={() => setShowRemoveGroupModal(false)}>
          <div style={{ background: "white", padding: "1rem", borderRadius: "8px", minWidth: "300px" }} onClick={e => e.stopPropagation()}>
            <h3>Select Group to Remove</h3>
            <select value={selectedGroup ?? ""} onChange={e => setSelectedGroup(e.target.value)} style={{ width: "100%", marginBottom: "1rem" }}>
              <option value="">-- Select a group --</option>
              {(users.find(u => u.cognitoUsername === currentUserForGroupAction)?.groups ?? []).map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
            <button disabled={!selectedGroup} onClick={async () => {
              if (currentUserForGroupAction && selectedGroup) {
                await handleRemoveFromGroup(currentUserForGroupAction, selectedGroup);
                setShowRemoveGroupModal(false);
                setSelectedGroup(null);
                setCurrentUserForGroupAction(null);
              }
            }}>Remove</button>
            <button onClick={() => setShowRemoveGroupModal(false)} style={{ marginLeft: "1rem" }}>Cancel</button>
          </div>
        </div>
      )}

      {showSetPasswordModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1500 }} onClick={() => setShowSetPasswordModal(false)}>
          <div style={{ background: "white", padding: "1rem", borderRadius: "8px", minWidth: "300px" }} onClick={e => e.stopPropagation()}>
            <h3>Set New Password</h3>
            <label>
              New Password:
              <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} style={{ width: "100%", marginBottom: "1rem" }} />
            </label>
            <label>
              Permanent Change:
              <select value={permanentFlag ? "true" : "false"} onChange={e => setPermanentFlag(e.target.value === "true")} style={{ width: "100%", marginBottom: "1rem" }}>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </label>
            <button onClick={handleSetPasswordSubmit} disabled={!passwordInput}>Set Password</button>
            <button onClick={() => setShowSetPasswordModal(false)} style={{ marginLeft: "1rem" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
