import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { StorageImage, FileUploader } from '@aws-amplify/ui-react-storage';

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

interface Project {
  id: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  project_name: string;
  project_description?: string | null;
  project_icon?: string | null;
  project_component?: string | null;
  show_project?: boolean | null;
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
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [permanentFlag, setPermanentFlag] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectIcon, setNewProjectIcon] = useState("");
  const [newProjectComponent, setNewProjectComponent] = useState("");
  const [newProjectShow, setNewProjectShow] = useState(true);

  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

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

  // Function to fetch all projects
  async function fetchProjects() {
    setLoadingProjects(true);
    setProjectsError(null);
    try {
      const { data: projectsData, errors } = await client.models.Projects.list();
      if (errors) {
        console.error("Error fetching projects:", errors);
        setProjectsError("Failed to fetch projects");
        setProjects([]);
      } else {
        setProjects(projectsData ?? []);
      }
    } catch (error) {
      console.error("Exception fetching projects:", error);
      setProjectsError("Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }

  useEffect(() => {
    refreshUsers();
    fetchAvailableGroups();
    fetchProjects();
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

  async function handleCreateProject() {
    if (!newProjectName) {
      alert("Project name is required.");
      return;
    }
    try {
      const { errors, data: createdProject } = await client.models.Projects.create({
        project_name: newProjectName,
        project_description: newProjectDescription || undefined,
        project_icon: newProjectIcon || undefined,
        project_component: newProjectComponent || undefined,
        show_project: newProjectShow,
      });
      if (errors) {
        console.error("Error creating project:", errors);
        alert("Failed to create project.");
      } else if (createdProject) {
        alert(`Project '${createdProject.project_name}' created successfully.`);
        setShowCreateProjectModal(false);
        setNewProjectName("");
        setNewProjectDescription("");
        setNewProjectIcon("");
        setNewProjectComponent("");
        setNewProjectShow(true);
        fetchProjects();
      }
    } catch (error) {
      console.error("Exception creating project:", error);
      alert("Failed to create project.");
    }
  }

  async function handleDeleteProject(projectId: string) {
    if (!projectId) {
      alert("Invalid project ID.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }
    try {
      const { errors } = await client.models.Projects.delete({ id: projectId });
      if (errors) {
        console.error("Failed to delete project:", errors);
        alert("Failed to delete project.");
      } else {
        alert(`Project deleted successfully.`);
        fetchProjects();
      }
    } catch (error) {
      console.error("Exception deleting project:", error);
      alert("Failed to delete project.");
    }
  }

  // Open edit modal and populate fields
  function openEditModal(project: Project) {
    setEditProject(project);
    setShowEditProjectModal(true);
  }

  // Handle edit project save
  async function handleSaveEditProject() {
    if (!editProject) return;
    if (!editProject.project_name.trim()) {
      alert("Project name cannot be empty.");
      return;
    }
    try {
      const { data: updatedProject, errors } = await client.models.Projects.update({
        id: editProject.id,
        project_name: editProject.project_name,
        project_description: editProject.project_description || undefined,
        project_icon: editProject.project_icon || undefined,
        project_component: editProject.project_component || undefined,
        show_project: editProject.show_project ?? false,
      });
      if (errors) {
        console.error("Failed to update project:", errors);
        alert("Failed to update project.");
      } else if (updatedProject) {
        alert(`Project '${updatedProject.project_name}' updated successfully.`);
        setShowEditProjectModal(false);
        setEditProject(null);
        fetchProjects();
      }
    } catch (error) {
      console.error("Exception updating project:", error);
      alert("Failed to update project.");
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
                    setSelectedGroup(null);
                    setShowAddGroupModal(true);
                  }}>Add to Group</button>
                  <button onClick={() => {
                    setCurrentUserForGroupAction(user.cognitoUsername);
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

      <section style={{ marginTop: "2rem" }}>
        <h2>Project Management</h2>
        <button onClick={() => setShowCreateProjectModal(true)} style={{ marginBottom: "1rem" }}>
          Create New Project
        </button>
        {loadingProjects && <p>Loading projects...</p>}
        {projectsError && <p style={{ color: "red" }}>{projectsError}</p>}
        {!loadingProjects && !projectsError && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid black", padding: "0.5rem" }}>Created On</th>
                <th style={{ border: "1px solid black", padding: "0.5rem" }}>Updated On</th>
                <th style={{ border: "1px solid black", padding: "0.5rem" }}>Project Name</th>
                <th style={{ border: "1px solid black", padding: "0.5rem" }}>Description</th>
                <th style={{ border: "1px solid black", padding: "0.5rem" }}>Icon</th>
                <th style={{ border: "1px solid black", padding: "0.5rem" }}>URL</th>
                <th style={{ border: "1px solid black", padding: "0.5rem" }}>Show Project</th>
                <th style={{ border: "1px solid black", padding: "0.5rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id ?? "unknown"}>
                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>{project.createdAt ? new Date(project.createdAt).toLocaleString() : "-"}</td>
                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>{project.updatedAt ? new Date(project.updatedAt).toLocaleString() : "-"}</td>
                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>{project.project_name}</td>
                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>{project.project_description ?? "-"}</td>
                  <td style={{ border: "1px solid black", padding: "0.5rem" }}><StorageImage alt={project.project_name} path={project.project_icon ?? "-"} /></td>
                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>
                    {project.project_component ?? ("-")}
                  </td>
                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>{project.show_project ? "Yes" : "No"}</td>
                  <td style={{ border: "1px solid black", padding: "0.5rem", display: "flex", gap: "0.25rem" }}>
                    <button onClick={() => openEditModal(project)}>Update</button>
                    <button onClick={() => handleDeleteProject(project.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showCreateProjectModal && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1500 }} onClick={() => setShowCreateProjectModal(false)}>
            <div style={{ background: "white", padding: "1rem", borderRadius: "8px", minWidth: "300px" }} onClick={e => e.stopPropagation()}>
              <h3>Create New Project</h3>
              <label>
                Project Name (required):
                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} style={{ width: "100%", marginBottom: "1rem" }} />
              </label>
              <label>
                Description:
                <textarea value={newProjectDescription} onChange={e => setNewProjectDescription(e.target.value)} style={{ width: "100%", marginBottom: "1rem" }} />
              </label>
              <label>
                Icon URL:
                <input type="text" value={newProjectIcon} onChange={e => setNewProjectIcon(e.target.value)} style={{ width: "100%", marginBottom: "1rem" }} />
                <FileUploader
                  acceptedFileTypes={["image/*"]}
                  path="project-icons/"
                  maxFileCount={1}
                  isResumable
                  onUploadSuccess={(event) => {
                    const key = event.key;
                    setNewProjectIcon(key || "");
                  }}
                />
              </label>
              <label>
                Project Component:
                <input type="text" value={newProjectComponent} onChange={e => setNewProjectComponent(e.target.value)} style={{ width: "100%", marginBottom: "1rem" }} />
              </label>
              <label>
                Show Project:
                <select value={newProjectShow ? "true" : "false"} onChange={e => setNewProjectShow(e.target.value === "true")} style={{ width: "100%", marginBottom: "1rem" }}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <button onClick={handleCreateProject} disabled={!newProjectName}>Create</button>
              <button onClick={() => setShowCreateProjectModal(false)} style={{ marginLeft: "1rem" }}>Cancel</button>
            </div>
          </div>
        )}

        {showEditProjectModal && editProject && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1500 }} onClick={() => setShowEditProjectModal(false)}>
            <div style={{ background: "white", padding: "1rem", borderRadius: "8px", minWidth: "300px" }} onClick={e => e.stopPropagation()}>
              <h3>Edit Project</h3>
              <label>
                Project Name (required):
                <input type="text" value={editProject.project_name} onChange={e => setEditProject({ ...editProject, project_name: e.target.value })} style={{ width: "100%", marginBottom: "1rem" }} />
              </label>
              <label>
                Description:
                <textarea value={editProject.project_description ?? ""} onChange={e => setEditProject({ ...editProject, project_description: e.target.value })} style={{ width: "100%", marginBottom: "1rem" }} />
              </label>
              <label>
                Icon URL:
                <input type="text" value={editProject.project_icon ?? ""} onChange={e => setEditProject({ ...editProject, project_icon: e.target.value })} style={{ width: "100%", marginBottom: "1rem" }} />
                <FileUploader
                  acceptedFileTypes={["image/*"]}
                  path="project-icons/"
                  maxFileCount={1}
                  isResumable
                  onUploadSuccess={(event) => {
                    const key = event.key;
                    setEditProject(editProject ? { ...editProject, project_icon: key || "" } : null);
                  }}
                />
              </label>
              <label>
                Project Component:
                <input type="text" value={editProject.project_component ?? ""} onChange={e => setEditProject({ ...editProject, project_component: e.target.value })} style={{ width: "100%", marginBottom: "1rem" }} />
              </label>
              <label>
                Show Project:
                <select value={editProject.show_project ? "true" : "false"} onChange={e => setEditProject({ ...editProject, show_project: e.target.value === "true" })} style={{ width: "100%", marginBottom: "1rem" }}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <button onClick={handleSaveEditProject} disabled={!editProject.project_name}>Save</button>
              <button onClick={() => setShowEditProjectModal(false)} style={{ marginLeft: "1rem" }}>Cancel</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Admin;
