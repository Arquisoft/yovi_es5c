import React, { useState } from "react";
import { Box, Paper, Typography, TextField, Button, Link as MuiLink, Container, Alert } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "../SessionContext";
import { translateBackendError } from "../utils/translateBackendError";

const LoginForm = () => {
  // Estados para capturar las entradas del usuario y manejar errores
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Hook para crear la sesión y hook para redirigir
  const { createSession } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue
    setError(""); // Reiniciamos los errores previos

    try {
      // Petición POST al Gateway (usualmente puerto 8000 en base a tu archivo gateway-service.js)
      const gatewayUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'; // O usa import.meta.env.VITE_GATEWAY_URL si usas Vite

      const response = await fetch(`${gatewayUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Si el login es exitoso (código 200), creamos la sesión
        createSession(username);
        
        // Opcional: Si necesitas guardar el token JWT (data.token) devuelto por el users-service, puedes hacerlo aquí
        // localStorage.setItem("jwtToken", data.token);

        // Redirigir a la vista principal
        navigate("/"); 
      } else {
        // En caso de credenciales incorrectas, capturamos el mensaje de tu backend
        setError(translateBackendError(data.error, t) || t("errors.genericLogin"));
      }
    } catch (e:unknown) {
          if (e instanceof Error) {
            console.log(e.message)
          }
      setError(t("errors.genericConnection"));
    }
  };

  return (
    <Container className="uiContainer"> 
      <Paper className="uiCard" elevation={0} >
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          {t("auth.welcome")}
        </Typography>

        {/* Mostramos el error de forma visual usando Alert de MUI */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* El formulario que engloba los campos y permite activar onSubmit al pulsar enter o clickar el botón */}
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <TextField 
            required 
            fullWidth 
            label={t("auth.user")} 
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
            label={t("auth.password")} 
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
            {t("auth.login")}
          </Button>
        </form>

        <Box className="formFooter" sx={{ mt: 3 }}>
          <Typography variant="body1">
            {t("auth.noAccountYet")}{" "}
            <MuiLink component={Link} to="/register" underline="always">
              {t("auth.signUp")}
            </MuiLink>
          </Typography>
        </Box>
        
      </Paper>
    </Container>
  );
};

export default LoginForm;