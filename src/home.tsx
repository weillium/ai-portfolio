import React, { useState } from 'react';

function Home({ isAdmin }: { isAdmin: boolean }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ minHeight: "100vh", padding: "1rem", position: "relative" }}>
      <header style={{ position: "fixed", top: 0, right: 0, padding: "1rem", zIndex: 1100 }}>
        {/* No auth buttons */}
      </header>

      <main style={{ marginTop: "4rem", textAlign: "center" }}>
        <h1>Welcome</h1>
        {isAdmin && (
          <>
            <button onClick={() => setShowModal(true)} style={{ padding: "0.5rem 1rem", fontSize: "1rem", marginTop: "1rem" }}>
              Admin Panel
            </button>

            {showModal && (
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
                onClick={() => setShowModal(false)}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "2rem",
                    borderRadius: "8px",
                    minWidth: "300px",
                    maxWidth: "90vw",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2>Admin Panel</h2>
                  <section style={{ marginBottom: "1rem" }}>
                    <h3>Manage Projects</h3>
                    <p>Placeholder for project management.</p>
                  </section>
                  <section>
                    <h3>Manage Users</h3>
                    <p>Placeholder for user management.</p>
                  </section>
                  <button onClick={() => setShowModal(false)} style={{ marginTop: "1rem" }}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Home;
