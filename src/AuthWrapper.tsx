import React, { ReactElement, cloneElement, useState, useEffect } from "react";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes, fetchAuthSession, updateUserAttribute, resetPassword, confirmResetPassword } from "@aws-amplify/auth";
import ProjectGallery from './projectGallery';

interface AuthWrapperProps {
  children: ReactElement<{ isAdmin: boolean }>;
}

function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, signOut } = useAuthenticator();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountInfoModal, setShowAccountInfoModal] = useState(false);
  const [showProjectGalleryModal, setShowProjectGalleryModal] = useState(false);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [displayName, setDisplayName] = useState<string>("");
  const [groups, setGroups] = useState<string[]>([]);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [updatingDisplayName, setUpdatingDisplayName] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<"REQUEST" | "CONFIRM" | "DONE">("REQUEST");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    async function fetchUserInfo() {
      if (user) {
        try {
          const attributes = await fetchUserAttributes();
          setEmail(attributes.email ?? user.username);
          setDisplayName(attributes.preferred_username ?? "");

          // Use fetchAuthSession to get current groups
          const session = await fetchAuthSession();
          if (
            session.tokens &&
            session.tokens.accessToken &&
            session.tokens.accessToken.payload &&
            session.tokens.accessToken.payload["cognito:groups"]
          ) {
            const groupsFromToken = session.tokens.accessToken.payload["cognito:groups"];
            if (typeof groupsFromToken === "string") {
              setGroups(groupsFromToken.split(","));
            } else if (Array.isArray(groupsFromToken)) {
              setGroups(groupsFromToken.map((g) => String(g)));
            } else {
              setGroups([]);
            }
          } else {
            setGroups([]);
          }

          // Show login success message and auto close modal
          setLoginSuccess(true);
          setTimeout(() => {
            setShowAuthModal(false);
            setLoginSuccess(false);
          }, 2000);
        } catch (error) {
          console.error("Failed to fetch user attributes or session", error);
          setEmail(undefined);
          setGroups([]);
          setDisplayName("");
        }
      } else {
        setEmail(undefined);
        setGroups([]);
        setDisplayName("");
      }
    }
    fetchUserInfo();
  }, [user]);

  const isAdmin = groups.includes("admin");

  async function handleDisplayNameUpdate() {
    setUpdatingDisplayName(true);
    setUpdateError(null);

    try {
      const output = await updateUserAttribute({
        userAttribute: {
          attributeKey: "preferred_username",
          value: displayName
        }
      });

      if (output && !('error' in output)) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 2000);
      } else {
        setUpdateError("Failed to update display name");
      }
    } catch (error) {
      setUpdateError("Error updating display name");
    } finally {
      setUpdatingDisplayName(false);
    }
  }

  async function handleRequestResetPassword() {
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(false);
    try {
      const output = await resetPassword({ username: email ?? "" });
      if (output.nextStep.resetPasswordStep === "CONFIRM_RESET_PASSWORD_WITH_CODE") {
        setResetStep("CONFIRM");
      } else if (output.nextStep.resetPasswordStep === "DONE") {
        setResetStep("DONE");
        setResetSuccess(true);
      }
    } catch (error) {
      setResetError("Failed to request password reset.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleConfirmResetPassword() {
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(false);
    try {
      await confirmResetPassword({
        username: email ?? "",
        confirmationCode: resetCode,
        newPassword: resetNewPassword,
      });
      setResetStep("DONE");
      setResetSuccess(true);
    } catch (error) {
      setResetError("Failed to confirm password reset.");
    } finally {
      setResetLoading(false);
    }
  }

  // Pass isAdmin prop to children
  const childrenWithProps = cloneElement(children, { isAdmin });

  return (
    <>
      {childrenWithProps}

      {user && (
        <>
          <div style={{ position: "fixed", top: 10, right: 10, zIndex: 1100, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={() => setShowProjectGalleryModal(true)}
            >
              Project Gallery
            </button>
            <button
              style={{ marginRight: "1rem" }}
              onClick={() => setShowAccountInfoModal(true)}
            >
              Account Info
            </button>
          </div>

          {showAccountInfoModal && (
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
                zIndex: 1300,
              }}
              onClick={() => setShowAccountInfoModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ background: "white", padding: "2rem", borderRadius: "8px", minWidth: "320px" }}
              >
                <h2>Account Info</h2>
                <p><strong>Email:</strong> {email ?? "Unknown"}</p>
                <p>
                  <strong>Display Name:</strong>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{ marginLeft: "0.5rem" }}
                  />
                  <button
                    onClick={handleDisplayNameUpdate}
                    disabled={updatingDisplayName}
                    style={{ marginLeft: "0.5rem" }}
                  >
                    {updatingDisplayName ? "Updating..." : "Update"}
                  </button>
                </p>
                {updateSuccess && <p style={{ color: "green" }}>Display name updated successfully!</p>}
                {updateError && <p style={{ color: "red" }}>{updateError}</p>}
                <p><strong>Groups:</strong> {groups.length > 0 ? groups.join(", ") : "None"}</p>

                <button onClick={() => signOut()} style={{ marginTop: "1rem" }}>
                  Logout
                </button>

                <hr />

                <h3>Reset Password</h3>
                {resetStep === "REQUEST" && (
                  <>
                    <p>Click the button below to request a password reset code sent to your email.</p>
                    <button onClick={handleRequestResetPassword} disabled={resetLoading}>
                      {resetLoading ? "Sending..." : "Send Reset Code"}
                    </button>
                  </>
                )}
                {resetStep === "CONFIRM" && (
                  <>
                    <p>
                      <label>
                        Confirmation Code:
                        <input
                          type="text"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          style={{ marginLeft: "0.5rem" }}
                        />
                      </label>
                    </p>
                    <p>
                      <label>
                        New Password:
                        <input
                          type="password"
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          style={{ marginLeft: "0.5rem" }}
                        />
                      </label>
                    </p>
                    <button onClick={handleConfirmResetPassword} disabled={resetLoading}>
                      {resetLoading ? "Confirming..." : "Confirm Reset"}
                    </button>
                  </>
                )}
                {resetStep === "DONE" && resetSuccess && <p style={{ color: "green" }}>Password reset successfully!</p>}
                {resetError && <p style={{ color: "red" }}>{resetError}</p>}

                <hr />
                <button onClick={() => setShowAccountInfoModal(false)}>Close</button>
              </div>
            </div>
          )}

          {showProjectGalleryModal && (
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
                zIndex: 1400,
              }}
              onClick={() => setShowProjectGalleryModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ background: "white", padding: "2rem", borderRadius: "8px", minWidth: "320px", maxHeight: "80vh", overflowY: "auto" }}
              >
                <h2>Project Gallery</h2>
                <ProjectGallery />
                <button onClick={() => setShowProjectGalleryModal(false)}>Close</button>
              </div>
            </div>
          )}
        </>
      )}

      {!user && (
        <div style={{ position: "fixed", top: 10, right: 10, zIndex: 1100, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setShowProjectGalleryModal(true)}
          >
            Project Gallery
          </button>
          <button
            onClick={() => setShowAuthModal(true)}
          >
            Login / Signup
          </button>
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
            {loginSuccess && (
              <div style={{ color: "green", marginTop: "1rem", textAlign: "center" }}>
                Login successful!
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AuthWrapper;
