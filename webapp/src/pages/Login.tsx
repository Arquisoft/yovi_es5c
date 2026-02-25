import { Box, Paper, Typography, TextField, Button, Link as MuiLink, Container } from "@mui/material";
import { Link } from "react-router-dom";

const Login = () => {
  return (
    <Box
      sx={{
        backgroundImage: "url(/fondo.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        display: "flex",
        alignItems: "center", // Centra verticalmente
        justifyContent: "flex-start", // Alinea a la izquierda
      }}
    >
      {/* Contenedor para limitar el ancho y dar margen a la izquierda */}
      <Container maxWidth="xs" sx={{ ml: { xs: 2, md: 8 } }}> 
        <Paper 
          elevation={6} 
          sx={{ 
            padding: 4, 
            display: "flex", 
            flexDirection: "column", 
            gap: 2,
            width: "100%"
          }}
        >
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Iniciar Sesión
          </Typography>

          {/* Campos del formulario (Solo visual, sin lógica de estado aún) */}
          <TextField
            required
            fullWidth
            label="Username"
            name="username"
            autoFocus
          />
          
          <TextField
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
          >
            Log In
          </Button>

          {/* Pie de la tarjeta: Enlace a Registro */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Typography variant="body2">
              ¿Aún no tienes cuenta?{" "}
              <MuiLink component={Link} to="/register" underline="hover">
                Regístrate
              </MuiLink>
            </Typography>
          </Box>
          
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;