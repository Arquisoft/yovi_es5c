import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Grid,
  Alert,
} from "@mui/material";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../SessionContext';

const apiEndpoint = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface FormData {
  username: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterForm = () => {
  const navigate = useNavigate();

  const { createSession } = useSession();

  const [formData, setFormData] = useState<FormData>({
    username: "",
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [surnameError, setSurnameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

  const isPasswordValid = passwordRegex.test(formData.password); 

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === "username") setUsernameError(null);
    if (name === "name") setNameError(null);
    if (name === "surname") setSurnameError(null);
    if (name === "email") setEmailError(null);
    if (name === "password") {
      if (!isPasswordValid) {
        setPasswordError(
        "The password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.");
      } else {
        setPasswordError(null);
      }
    }
    if (name === "confirmPassword") {
    if (value !== formData.password) {
        setConfirmPasswordError("Passwords do not match");
    } else {
        setConfirmPasswordError(null);
    }
}
      
    
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  let hasError = false;

  if (!formData.username.trim()) {
    setUsernameError("Required field");
    hasError = true;
  }

  if (!formData.name.trim()) {
    setNameError("Required field");
    hasError = true;
  }

  if (!formData.surname.trim()) {
    setSurnameError("Required field");
    hasError = true;
  }

  if (!formData.email.trim()) {
    setEmailError("Required field");
    hasError = true;
  }

  if (!formData.password.trim()) {
    setPasswordError("Required field");
    hasError = true;
  }else if (!isPasswordValid) {
    setPasswordError(
        "The password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.");
  }

  if (formData.password !== formData.confirmPassword) {
    setConfirmPasswordError("Passwords do not match");
    hasError = true;
  }

  if (hasError) return;

  setLoading(true);
  try {
      await axios.post(`${apiEndpoint}/user`, {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        surname: formData.surname,
        email: formData.email
      });

      // automatic login after registration 
      //await axios.post(`${apiEndpoint}/login`, { 
       // username: formData.username, 
       // password: formData.password 
      //})

      // create session and navigate to homepage
      createSession(formData.username);
      navigate('/homepage');

    } catch (err: any) {
      const backendError = err.response?.data?.error || "An unexpected error occurred during registration";
      setError(backendError);
    }

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

        {/* Name */}
        <Grid size={12}>
          <TextField
            required
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!nameError}
            helperText={nameError || ""}
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
        disabled={loading}
        sx={{ mt: 3 }}
      >
        Register
      </Button>
    </Box>
  );
};

export default RegisterForm;