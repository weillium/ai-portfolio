import Home from "./portfolio/home";
import AuthWrapper from "./portfolio/AuthWrapper";
import React from "react";

function App() {
  return (
    <AuthWrapper>
      <Home isAdmin={false} />
    </AuthWrapper>
  );
}

export default App;
// This is the main entry point for the application, wrapping the Home component with AuthWrapper for authentication context.
// It imports the Home component from the portfolio directory and the AuthWrapper for managing authentication state.
// The AuthWrapper provides the necessary context for user authentication and authorization, allowing the Home component to
// access user attributes and session information. The Home component is rendered with an `isAdmin` prop set to false, indicating that
// the user is not an admin by default. This setup allows for a clean separation of concerns, where the authentication logic is handled in the AuthWrapper,
// and the Home component focuses on rendering the user interface based on the authentication state.
// The AuthWrapper can be extended in the future to include additional authentication features, such as user roles or permissions, without modifying the
// Home component directly. This modular approach enhances maintainability and scalability of the application as it grows