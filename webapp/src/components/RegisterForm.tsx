import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Grid,
  Alert,
} from "@mui/material";

interface FormData {
  username: string;
  email: string;
  surname: string;
  password: string;
  confirmPassword: string;
}

const RegisterForm = () => {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    surname: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [surnameError, setSurnameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === "username") setUsernameError(null);
    if (name === "email") setEmailError(null);
    if (name === "surname") setSurnameError(null);
    if (name === "password") setPasswordError(null);
    if (name === "confirmPassword") setConfirmPasswordError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    if (!formData.username.trim()) {
      setUsernameError("Required field");
      hasError = true;
    }

    if (!formData.email.trim()) {
      setEmailError("Required field");
      hasError = true;
    }

    if (!formData.surname.trim()) {
      setSurnameError("Required field");
      hasError = true;
    }

    if (!formData.password.trim()) {
      setPasswordError("Required field");
      hasError = true;
    }

    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    }

    if (hasError) return;

    console.log("Send to backend:", formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        {/* Username */}
        <Grid size={12}>
          <TextField
            required
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={!!usernameError}
            helperText={usernameError || ""}
          />
        </Grid>

        {/* Email */}
        <Grid size={12}>
          <TextField
            required
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!emailError}
            helperText={emailError || ""}
          />
        </Grid>

        {/* Surname */}
        <Grid size={12}>
          <TextField
            required
            fullWidth
            label="Surname"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            error={!!surnameError}
            helperText={surnameError || ""}
          />
        </Grid>

        {/* Password */}
        <Grid size={12}>
          <TextField
            required
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={!!passwordError}
            helperText={passwordError || ""}
          />
        </Grid>

        {/* Confirm Password */}
        <Grid size={12}>
          <TextField
            required
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!confirmPasswordError}
            helperText={confirmPasswordError || ""}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3 }}
      >
        Register
      </Button>
    </Box>
  );
};

export default RegisterForm;