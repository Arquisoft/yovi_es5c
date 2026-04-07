import React, { useState } from "react";
import { Box, Paper, Typography, TextField, Button, Link as MuiLink, Container, Alert } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../SessionContext"; // Ajusta la ruta si es necesario

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { createSession } = useSession();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue
    setError("");

    try {
      const gatewayUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const response = await fetch(`${gatewayUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {

        createSession(username, data.token);
        navigate("/"); 

      } else {
        setError(data.error || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <Container className="uiContainer"> 
      <Paper className="uiCard" elevation={0} >
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Welcome
        </Typography>

        {/* Mostramos el error de forma visual usando Alert de MUI */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* El formulario que engloba los campos y permite activar onSubmit al pulsar enter o clickar el botón */}
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <TextField 
            required 
            fullWidth 
            label="User" 
            name="username" 
            autoFocus
            margin="normal" // Agregado para que no se peguen
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField 
            required 
            fullWidth 
            name="password" 
            label="Password" 
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button 
            className="uiButton" 
            type="submit" 
            fullWidth 
            variant="contained" 
            size="large"
            sx={{ mt: 2 }} // Un poco de margen superior
          >
            Log-In
          </Button>
        </form>

        <Box className="formFooter" sx={{ mt: 3 }}>
          <Typography variant="body1">
            You don't have an account yet?{" "}
            <MuiLink component={Link} to="/register" underline="always">
              Sign-up
            </MuiLink>
          </Typography>
        </Box>
        
      </Paper>
    </Container>
  );
};

export default LoginForm;