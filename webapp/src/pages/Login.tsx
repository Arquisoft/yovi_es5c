import {Box} from "@mui/material";
import LoginForm from "../components/LoginForm";
import "./Login.css"

const Login = () => {

  return (
    <Box className="login">
      <LoginForm />
    </Box>
  );
};

export default Login;