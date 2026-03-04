import { Container, Typography, Box, Paper } from "@mui/material";
import RegisterForm from "../components/RegisterForm";

const Register = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            User registration
          </Typography>

          <RegisterForm />
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;