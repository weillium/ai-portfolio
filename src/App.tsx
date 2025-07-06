import Home from "./home";
import AuthWrapper from "./AuthWrapper";
import React from "react";

function App() {
  return (
    <AuthWrapper>
      <Home isAdmin={false} />
    </AuthWrapper>
  );
}

export default App;
