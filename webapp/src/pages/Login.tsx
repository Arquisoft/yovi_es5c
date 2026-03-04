import {Box} from "@mui/material";
import LoginForm from "../components/LoginForm";
import "./Login.css";
import { useEffect } from "react";
import { updateThemeColors } from "../utils/themeController";

const Login = () => {

  useEffect(() => {
    updateThemeColors({
        accentColor: "#1976d2",
        buttonBg: "#1976d2",
        buttonText: "#ffffff",
        inputBg: "rgba(255, 255, 255, 0.5)",
        inputOutline: "rgba(0, 0, 0, 0.23)",
        textPrimary: "rgba(0, 0, 0, 0.87)",
        textSecondary: "rgba(0, 0, 0, 0.6)",
        cardBg: "rgba(255, 255, 255, 0.65)"
      });
  }, []);

  return (
    <Box className="login">
      <LoginForm />
    </Box>
  );
};

export default Login;