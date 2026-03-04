import { Box, Paper, Typography, TextField, Button, Link as MuiLink, Container } from "@mui/material";
import { Link } from "react-router-dom";

const LoginForm = () => {
  const accentColor = "#4fc3f7";

  return (
	<Container className="loginContainer"> 
	<Paper className="loginCard" elevation={0} >
		<Typography component="h1" variant="h4" align="center" gutterBottom>
		Welcome
		</Typography>

		<TextField required fullWidth label="User" name="username" autoFocus />
		<TextField required fullWidth name="password" label="Password" type="password" />

		<Button className="loginButton" type="submit" fullWidth variant="contained" size="large">
		Log-In
		</Button>

		<Box className="formFooter">
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