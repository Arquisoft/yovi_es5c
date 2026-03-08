import { Container, Typography, Box, Paper } from "@mui/material";
import { Navigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";
import { useSession } from "../SessionContext";

const Register = () => {
  const { isLoggedIn } = useSession();

  if (isLoggedIn) {
    return <Navigate to="/homepage" replace />;
  }

  return (
    <Container className="yovi-ui" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper className="uiCard" elevation={3} sx={{ padding: 4, width: "100%" }}>
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
