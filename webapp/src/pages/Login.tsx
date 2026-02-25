import { Box, Paper, Typography, TextField, Button, Link as MuiLink, Container } from "@mui/material";
import { Link } from "react-router-dom";

const Login = () => {
  return (
    <Box
      sx={{
        backgroundImage: "url(/login-background.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <Container maxWidth="xs" sx={{ ml: { xs: 2, md: 8 } }}> 
        <Paper 
          elevation={0} // Quitamos la sombra por defecto de MUI para usar la nuestra
          sx={{ 
            padding: 4, 
            display: "flex", 
            flexDirection: "column", 
            gap: 2,
            width: "100%",
            
            // --- EFECTO CRISTAL (GLASSMORPHISM) ---
            backgroundColor: "rgba(255, 255, 255, 0.4)", // Fondo blanco con 40% de opacidad
            backdropFilter: "blur(12px)", // Desenfoque de lo que hay detrás
            WebkitBackdropFilter: "blur(12px)", // Soporte para navegadores basados en Safari
            borderRadius: "24px", // Bordes bastante redondeados
            border: "1px solid rgba(255, 255, 255, 0.5)", // Borde sutil para el brillo del cristal
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)", // Sombra exterior suave y amplia
            // --------------------------------------
          }}
        >
          <Typography component="h1" variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
            Iniciar Sesión
          </Typography>

          <TextField
            required
            fullWidth
            label="Username"
            name="username"
            autoFocus
            // Le damos un fondo un poco más sólido a los inputs para que resalten sobre el cristal
            sx={{ backgroundColor: "rgba(255, 255, 255, 0.7)", borderRadius: 1 }}
          />
          
          <TextField
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            sx={{ backgroundColor: "rgba(255, 255, 255, 0.7)", borderRadius: 1 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ 
              mt: 2, 
              borderRadius: "12px", // Botón también redondeado para que encaje con el estilo
              padding: "10px",
              fontWeight: "bold"
            }}
          >
            Log In
          </Button>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Typography variant="body2" sx={{ color: '#333' }}>
              ¿Aún no tienes cuenta?{" "}
              <MuiLink component={Link} to="/register" underline="always" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
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