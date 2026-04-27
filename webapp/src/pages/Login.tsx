import {Box} from "@mui/material";
import LoginForm from "../components/LoginForm";
import LanguageSwitcher from "../components/LanguageSwitcher";

const Login = () => {

  return (
    <Box className="login yovi-ui">
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <LanguageSwitcher />
      </Box>
      <LoginForm />
    </Box>
  );
};

export default Login;