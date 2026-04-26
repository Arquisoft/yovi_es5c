import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Grid,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../SessionContext';
import { translateBackendError } from '../utils/translateBackendError';

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
  const { t } = useTranslation();

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
    if (passwordRegex.test(value)) {
      setPasswordError(null);
    } else {
      setPasswordError(t("auth.passwordRules"));
    }
    }
    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setConfirmPasswordError(t("auth.passwordsDoNotMatch"));
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
    setUsernameError(t("auth.requiredField"));
    hasError = true;
  }

  if (!formData.name.trim()) {
    setNameError(t("auth.requiredField"));
    hasError = true;
  }

  if (!formData.surname.trim()) {
    setSurnameError(t("auth.requiredField"));
    hasError = true;
  }

  if (!formData.email.trim()) {
    setEmailError(t("auth.requiredField"));
    hasError = true;
  }

  if (!formData.password.trim()) {
    setPasswordError(t("auth.requiredField"));
    hasError = true;
  } else if (!passwordRegex.test(formData.password)) {
    setPasswordError(t("auth.passwordRules"));
    hasError = true;
  }

  if (formData.password !== formData.confirmPassword) {
    setConfirmPasswordError(t("auth.passwordsDoNotMatch"));
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

      // create session and navigate to homepage
      createSession(formData.username);
      navigate('/homepage');

    } catch (err: any) {
      const backendError = err.response?.data?.error;
      setError(translateBackendError(backendError, t) || t("errors.genericRegister"));
    } finally {
      setLoading(false);
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
            label={t("auth.username")}
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={!!usernameError}
            helperText={usernameError || ""}
            disabled={loading}
          />
        </Grid>

        {/* Name */}
        <Grid size={12}>
          <TextField
            required
            fullWidth
            label={t("auth.name")}
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!nameError}
            helperText={nameError || ""}
            disabled={loading}
          />
        </Grid>

        {/* Surname */}
        <Grid size={12}>
          <TextField
            required
            fullWidth
            label={t("auth.surname")}
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            error={!!surnameError}
            helperText={surnameError || ""}
            disabled={loading}
          />
        </Grid>


        {/* Email */}
        <Grid size={12}>
          <TextField
            required
            fullWidth
            label={t("auth.email")}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!emailError}
            helperText={emailError || ""}
            disabled={loading}
          />
        </Grid>

        {/* Password */}
        <Grid size={12}>
          <TextField
            required
            fullWidth
            label={t("auth.password")}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={!!passwordError}
            helperText={passwordError || ""}
            disabled={loading}
          />
        </Grid>

        {/* Confirm Password */}
        <Grid size={12}>
          <TextField
            required
            fullWidth
            label={t("auth.confirmPassword")}
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!confirmPasswordError}
            helperText={confirmPasswordError || ""}
            disabled={loading}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Button className="uiButton"
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        sx={{ mt: 3 }}
      >
        {t("auth.register")}
      </Button>
    </Box>
  );
};

export default RegisterForm;
