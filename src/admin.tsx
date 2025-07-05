import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

type Project = Schema["Projects"]["type"];

function Admin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});

  useEffect(() => {
    const subscription = client.models.Projects.observeQuery().subscribe({
      next: (data) => setProjects([...data.items]),
    });
    return () => subscription.unsubscribe();
  }, []);

  function handleInputChange(field: keyof Project, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    const now = Date.now();
    if (editingProject) {
      // Update existing project
      await client.models.Projects.update({
        ...editingProject,
        ...formData,
        updated_on: now,
      });
    } else {
      // Create new project
      await client.models.Projects.create({
        ...formData,
        project_id: crypto.randomUUID(),
        created_on: now,
        updated_on: now,
      } as Project);
    }
    setEditingProject(null);
    setFormData({});
  }

  async function handleDelete(project: Project) {
    if (window.confirm(`Are you sure you want to delete project "${project.project_name}"?`)) {
      await client.models.Projects.delete(project);
    }
  }

  function startEdit(project: Project) {
    setEditingProject(project);
    setFormData(project);
  }

  function startCreate() {
    setEditingProject(null);
    setFormData({});
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Admin - Manage Projects</h1>
      <button onClick={startCreate} style={{ marginBottom: "1rem" }}>
        Create New Project
      </button>

      {(editingProject !== null || Object.keys(formData).length > 0) && (
        <div style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
          <h2>{editingProject ? "Edit Project" : "New Project"}</h2>
          <label>
            Project Name:
            <input
              type="text"
              value={formData.project_name ?? ""}
              onChange={(e) => handleInputChange("project_name", e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <br />
          <label>
            Project Description:
            <textarea
              value={formData.project_description ?? ""}
              onChange={(e) => handleInputChange("project_description", e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <br />
          <label>
            Project Icon URL:
            <input
              type="text"
              value={formData.project_icon ?? ""}
              onChange={(e) => handleInputChange("project_icon", e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <br />
          <label>
            Project URL:
            <input
              type="text"
              value={formData.project_url ?? ""}
              onChange={(e) => handleInputChange("project_url", e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <br />
          <label>
            Show Project:
            <input
              type="checkbox"
              checked={formData.show_project ?? false}
              onChange={(e) => handleInputChange("show_project", e.target.checked)}
            />
          </label>
          <br />
          <button onClick={handleSave} style={{ marginRight: "1rem" }}>
            Save
          </button>
          <button onClick={() => { setEditingProject(null); setFormData({}); }}>
            Cancel
          </button>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Name</th>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Description</th>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Show</th>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.project_id}>
              <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{project.project_name}</td>
              <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{project.project_description}</td>
              <td style={{ border: "1px solid #ccc", padding: "0.5rem", textAlign: "center" }}>
                {project.show_project ? "✔️" : "❌"}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                <button onClick={() => startEdit(project)} style={{ marginRight: "0.5rem" }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(project)} style={{ color: "red" }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Admin;
