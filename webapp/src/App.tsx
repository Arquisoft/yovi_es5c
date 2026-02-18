import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState("Checking server...");

  useEffect(() => {
    fetch("http://localhost:4000/status")
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

    </div>
  );
}

export default App;
