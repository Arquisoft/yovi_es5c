import { Box, Paper, Typography, TextField, Button, Link as MuiLink, Container } from "@mui/material";
import { Link } from "react-router-dom";

const LoginForm = () => {
  const accentColor = "#4fc3f7";

  return (
	<Container maxWidth="xs" sx={{ ml: { xs: 2, md: 8 } }}> 
	<Paper className="loginForm" elevation={0} >
		<Typography component="h1" variant="h4" align="center" gutterBottom>
		Bienvenido
		</Typography>

		<TextField required fullWidth label="Usuario" name="username" autoFocus />
		<TextField required fullWidth name="password" label="Contraseña" type="password" />

		<Button className="loginButton" type="submit" fullWidth variant="contained" size="large">
		Iniciar Sesión
		</Button>

		<Box className="formFooter">
		<Typography variant="body1">
			¿Aún no tienes cuenta?{" "}
			<MuiLink component={Link} to="/register" underline="always">
			Regístrate
			</MuiLink>
		</Typography>
		</Box>
		
	</Paper>
	</Container>
  );
};

export default LoginForm;