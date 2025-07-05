import { useState, useEffect, cloneElement, ReactElement } from "react";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes } from "@aws-amplify/auth";

interface AuthWrapperProps {
  children: ReactElement;
}

function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, signOut } = useAuthenticator();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    async function fetchUserInfo() {
      if (user) {
        try {
          const attributes = await fetchUserAttributes();
          setEmail(attributes.email ?? user.username);
          const cognitoGroups = attributes["cognito:groups"];
          if (typeof cognitoGroups === "string") {
            setGroups(cognitoGroups.split(","));
          } else if (Array.isArray(cognitoGroups)) {
            setGroups(cognitoGroups);
          } else {
            setGroups([]);
          }
        } catch (error) {
          console.error("Failed to fetch user attributes", error);
          setEmail(undefined);
          setGroups([]);
        }
      } else {
        setEmail(undefined);
        setGroups([]);
      }
    }
    fetchUserInfo();
  }, [user]);

  const isAdmin = groups.includes("admin");

  // Pass isAdmin prop to children
  const childrenWithProps = cloneElement(children, { isAdmin });

  return (
    <>
      {childrenWithProps}

      {!user && (
        <button
          style={{ position: "fixed", top: 10, right: 10, zIndex: 1100 }}
          onClick={() => setShowAuthModal(true)}
        >
          Login / Signup
        </button>
      )}

      {user && (
        <div style={{ position: "fixed", top: 10, right: 10, zIndex: 1100, display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: "1rem" }}>{email ?? "User"}</span>
          <span style={{ marginRight: "1rem", fontStyle: "italic", color: "gray" }}>
            ({groups.join(", ")})
          </span>
          <button onClick={() => signOut()}>Logout</button>
        </div>
      )}

      {showAuthModal && (
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
          onClick={() => setShowAuthModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", padding: "2rem", borderRadius: "8px", minWidth: "320px" }}
          >
            <Authenticator />
          </div>
        </div>
      )}
    </>
  );
}

export default AuthWrapper;
