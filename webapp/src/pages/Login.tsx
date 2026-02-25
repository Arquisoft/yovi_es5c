import {Box} from "@mui/material";
import LoginForm from "../components/LoginForm";

const Login = () => {

  return (
    // Fondo del viewport
    <Box
      sx={{
        // Background
        backgroundImage: "url(/fondo.jpg)",
        backgroundPosition: "center",
        backgroundSize: "cover",
        // Distribucion de elementos
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <LoginForm />
    </Box>
  );
};

export default Login;