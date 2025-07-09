import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

function ProjectGallery() {
  const [projects, setProjects] = useState<Array<Schema["Projects"]["type"]>>([]);
  const [selectedProject, setSelectedProject] = useState<Schema["Projects"]["type"] | null>(null);

  useEffect(() => {
    const subscription = client.models.Projects.observeQuery({
      filter: { show_project: { eq: true } },
    }).subscribe({
      next: (data) => setProjects([...data.items]),
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setSelectedProject(project)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "1rem",
              border: "1px solid #ccc",
              borderRadius: "8px",
              background: "white",
              cursor: "pointer",
            }}
          >
            <img
              src={project.project_icon ?? ""}
              alt={project.project_name}
              style={{ width: "64px", height: "64px", objectFit: "contain" }}
            />
            <span>{project.project_name}</span>
          </button>
        ))}
      </div>

      {selectedProject && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedProject(null)}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedProject.project_name}</h2>
            <p>{selectedProject.project_description}</p>
            <p>
              Created on: {selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleDateString() : "N/A"}
            </p>
            <p>
              Last updated on: {selectedProject.updatedAt ? new Date(selectedProject.updatedAt).toLocaleDateString() : "N/A"}
            </p>
            <iframe
              src={selectedProject.project_url ?? ""}
              title={selectedProject.project_name}
              style={{ width: "100%", height: "400px", border: "none" }}
            />
            <button onClick={() => setSelectedProject(null)} style={{ marginTop: "1rem" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ProjectGallery;
