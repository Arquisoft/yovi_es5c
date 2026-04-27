import { useState } from "react";
import { TextField, Button, Box, Grid, Alert } from "@mui/material";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSession } from "../SessionContext";
import { translateBackendError } from "../utils/translateBackendError";

const apiEndpoint = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface FormData {
  currentPassword: string;
  newPassword: string;
  repeatNewPassword: string;
}

const ChangePasswordForm = () => {
  const navigate = useNavigate();
  const { username, destroySession } = useSession();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<FormData>({
    currentPassword: "",
    newPassword: "",
    repeatNewPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [repeatNewPasswordError, setRepeatNewPasswordError] = useState<string | null>(null);

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "currentPassword") setCurrentPasswordError(null);
    if (name === "newPassword") {
      if (passwordRegex.test(value)) {
        setNewPasswordError(null);
      } else {
        setNewPasswordError(t("auth.passwordRules"));
      }
    }
    if (name === "repeatNewPassword") {
      if (value === formData.newPassword) {
        setRepeatNewPasswordError(null);
      } else {
        setRepeatNewPasswordError(t("auth.passwordsDoNotMatch"));        
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let hasError = false;

    if (!formData.currentPassword) {
      setCurrentPasswordError(t("auth.requiredField"));
      hasError = true;
    }

    if (!formData.newPassword) {
      setNewPasswordError(t("auth.requiredField"));
      hasError = true;
    } else if (!passwordRegex.test(formData.newPassword)) {
      setNewPasswordError(t("auth.passwordRules"));
      hasError = true;
    }

    if (formData.newPassword !== formData.repeatNewPassword) {
      setRepeatNewPasswordError(t("auth.passwordsDoNotMatch"));
      hasError = true;
    }

    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
        setNewPasswordError(t("profile.newPasswordMustDiffer"));
        hasError = true;
    }

    if (hasError) return;


    setLoading(true);
    try {
      await axios.post(`${apiEndpoint}/user/change-password`, {
        username,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      alert(t("profile.changePasswordSuccess"));

      //Once accept is pressed, it'll log out
        if (username) {
          try {
            await axios.post(`${apiEndpoint}/logout`, { username });
          } catch {
            // Ignore logout network errors
          }
        }
        destroySession();
        navigate("/login");
  
    } catch (err: any) {
      setLoading(false);
      const backendError = err.response?.data?.error;
      setError(translateBackendError(backendError, t) || t("errors.genericChangePassword"));
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            required
            fullWidth
            name="currentPassword"
            label={t("profile.currentPassword")}
            type="password"
            id="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            error={!!currentPasswordError}
            helperText={currentPasswordError || ""}
            disabled={loading}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            required
            fullWidth
            name="newPassword"
            label={t("profile.newPassword")}
            type="password"
            id="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            error={!!newPasswordError}
            helperText={newPasswordError || ""}
            disabled={loading}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            required
            fullWidth
            name="repeatNewPassword"
            label={t("profile.repeatNewPassword")}
            type="password"
            id="repeatNewPassword"
            value={formData.repeatNewPassword}
            onChange={handleChange}
            error={!!repeatNewPasswordError}
            helperText={repeatNewPasswordError || ""}
            disabled={loading}
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
        sx={{ mt: 3, mb: 2 }}
      >
        {t("profile.changePassword")}
      </Button>
    </Box>
  );
};

export default ChangePasswordForm;
