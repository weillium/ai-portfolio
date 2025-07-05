import Home from "./home";
import AuthWrapper from "./AuthWrapper";

function App() {
  return (
    <AuthWrapper>
      <Home />
    </AuthWrapper>
  );
}

export default App;
