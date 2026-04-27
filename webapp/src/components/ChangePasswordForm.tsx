import { useState } from "react";
import { TextField, Button, Box, Grid, Alert } from "@mui/material";
import { useTranslation } from "react-i18next";

interface FormData {
  currentPassword: string;
  newPassword: string;
  repeatNewPassword: string;
}

const ChangePasswordForm = () => {
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
      if (value !== formData.newPassword) {
        setRepeatNewPasswordError(t("auth.passwordsDoNotMatch"));
      } else {
        setRepeatNewPasswordError(null);
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

    if (hasError) return;

    setLoading(true);
    // API logic will be implemented here
    setLoading(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            required
            fullWidth
            name="currentPassword"
            label="Current Password"
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
            label="New Password"
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
            label="Repeat New Password"
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
        Change Password
      </Button>
    </Box>
  );
};

export default ChangePasswordForm;
