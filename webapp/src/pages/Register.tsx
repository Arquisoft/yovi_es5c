import { Container, Typography, Box, Paper } from "@mui/material";
import RegisterForm from "../components/RegisterForm";

const Register = () => {
  return (
    <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 4 }}>
      <Box sx={{ width: '100%' }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Registro de Usuario
          </Typography>
          <RegisterForm />
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;