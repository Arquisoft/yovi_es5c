import { useEffect, useState } from 'react'
import './App.css'
import Register from "./pages/Register";

const API_URL = import.meta.env.VITE_GAMEY_URL || "http://localhost:4000";

function App() {
  const [status, setStatus] = useState("Checking server...");

  useEffect(() => {
    fetch(`${API_URL}/status`) 
      .then(response => {
        if (!response.ok) {
          throw new Error("Server error");
        }
        return response.text();
      })
      .then(data => {
        setStatus(data);
      })
      .catch(error => {
        console.error("Error:", error);
        setStatus("Server not reachable");
      });
  }, []);

  return (
    <div className="App">
      <h2>Welcome to the Software Architecture 2025-2026 course</h2>
      <h2>GameY coming soon</h2>
      <h3>Rust Server status: {status}</h3>

      <Register />
    </div>
  );
}

export default App;
