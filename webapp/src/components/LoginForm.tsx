import { Box, Paper, Typography, TextField, Button, Link as MuiLink, Container } from "@mui/material";
import { Link } from "react-router-dom";

const LoginForm = () => {
  const accentColor = "#4fc3f7"; 

  const darkGlassInputStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(0, 0, 0, 0.2)', // Fondo para los input
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: '12px',
      color: '#ffffff', // Color para el texto escrito
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.2)', // Borde blanco muy sutil
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.5)', // Borde un poco más visible al pasar el ratón
      },
      '&.Mui-focused fieldset': {
        borderColor: accentColor, // Borde del color de resaltado al hacer clic
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.6)', // Etiqueta en gris claro
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: accentColor, // Etiqueta del color de resaltado al hacer clic
    }
  };

  return (
	<Container maxWidth="xs" sx={{ ml: { xs: 2, md: 8 } }}> 
	<Paper 
		elevation={0} 
		sx={{ 
			padding: 5,
			display: "flex", 
			flexDirection: "column", 
			justifyContent: "center",
			gap: 3,
			width: "100%",
			minHeight: "60vh",
			
			// --- EFECTO CRISTAL OSCURO ---
			backgroundColor: "rgba(30, 30, 30, 0.6)",
			backdropFilter: "blur(16px)", 
			WebkitBackdropFilter: "blur(16px)", 
			borderRadius: "24px", 
			border: "1px solid rgba(255, 255, 255, 0.08)",
			boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.5)"
			// --------------------------------------
		}}
	>
		<Typography component="h1" variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#ffffff', mb: 2 }}>
		Bienvenido
		</Typography>

		<TextField
		required
		fullWidth
		label="Username"
		name="username"
		autoFocus
		sx={darkGlassInputStyle}
		/>
		
		<TextField
		required
		fullWidth
		name="password"
		label="Password"
		type="password"
		sx={darkGlassInputStyle}
		/>

		<Button
		type="submit"
		fullWidth
		variant="contained"
		size="large"
		sx={{ 
			mt: 2, 
			borderRadius: "12px", 
			padding: "12px",
			fontWeight: "bold",
			fontSize: "1rem",
			textTransform: 'none',
			backgroundColor: accentColor,
			color: '#000000', // Texto boton
			boxShadow: `0 4px 14px 0 ${accentColor}40`, // Sombra Boton
			'&:hover': {
			backgroundColor: '#29b6f6',
			boxShadow: `0 6px 20px 0 ${accentColor}60`,
			}
		}}
		>
		Iniciar Sesión
		</Button>

		<Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
		<Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
			¿Aún no tienes cuenta?{" "}
			<MuiLink component={Link} to="/register" underline="always" sx={{ fontWeight: 'bold', color: accentColor }}>
			Regístrate
			</MuiLink>
		</Typography>
		</Box>
		
	</Paper>
	</Container>
  );
};

export default LoginForm;