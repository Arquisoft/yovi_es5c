import {Routes, Route } from 'react-router-dom';  
import { Box } from '@mui/material'; 
import './App.css'
import Register from "./pages/Register";

function App() {
   
  return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh',gap: '0vh' }}>
        
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
        
      </Box>
  )
}

export default App;
