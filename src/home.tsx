import { useState } from "react";
import ProjectGallery from "./projectGallery";
import Admin from "./admin";

interface HomeProps {
  isAdmin?: boolean;
}

function Home({ isAdmin = false }: HomeProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  return (
    <div style={{ minHeight: "100vh", padding: "1rem", position: "relative" }}>
      <header style={{ position: "fixed", top: 0, right: 0, padding: "1rem", zIndex: 1100 }}>
        {/* No auth buttons */}
      </header>

      <main style={{ marginTop: "4rem", textAlign: "center" }}>
        <h1>Welcome</h1>
        {!showGallery ? (
          <button onClick={() => setShowGallery(true)}>Project Gallery</button>
        ) : (
          <ProjectGallery />
        )}
        
        {isAdmin && (
          <>
            <button style={{ marginTop: "1rem" }} onClick={() => setShowAdminPanel(true)}>
              Admin Panel
            </button>

            {showAdminPanel && (
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
                  zIndex: 1200,
                }}
                onClick={() => setShowAdminPanel(false)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: "white", padding: "2rem", borderRadius: "8px", maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }}
                >
                  <Admin />
                  <button onClick={() => setShowAdminPanel(false)} style={{ marginTop: "1rem" }}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {showGallery && (
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
              zIndex: 1200,
            }}
            onClick={() => setShowGallery(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: "white", padding: "2rem", borderRadius: "8px", maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }}
            >
              <ProjectGallery />
              <button onClick={() => setShowGallery(false)} style={{ marginTop: "1rem" }}>
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;
