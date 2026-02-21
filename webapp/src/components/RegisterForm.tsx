import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Grid,
  Alert,
} from "@mui/material";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  //ELIMINAR AL UNIR CON BACKEND
  const existingUsers = ["admin", "testuser", "maria"];

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

  const isPasswordValid = passwordRegex.test(formData.password); 

  const isConfirmPasswordValid =
    formData.confirmPassword === "" || formData.confirmPassword === formData.password;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Limpiar errores cuando el usuario escribe
    if (e.target.name === "name") setUsernameError(null);
    if (e.target.name === "email") setEmailError(null);
    if (e.target.name === "password") setPasswordError(null);
    
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    // Validar campos vacíos y formato básico
    if (formData.name.trim() === "") {
      setUsernameError("Campo obligatorio");
      hasError = true;
    }

    // Validar email
    const trimmedEmail = formData.email.trim();
    if (trimmedEmail === "") {
        setEmailError("Campo obligatorio");
        hasError = true;
    } else if (!trimmedEmail.includes("@")) {
        setEmailError("Email inválido");
        hasError = true;
    }

    if (formData.password.trim() === "") {
      setPasswordError("Campo obligatorio");
      hasError = true;
    }


    if (hasError) return;

    //ELIMINAR AL UNIR CON BACKEND
    // Validar usuario duplicado
    if (existingUsers.includes(formData.name.toLowerCase())) {
      setUsernameError("El nombre de usuario ya está en uso");
      setFormData({ ...formData, name: "" });
      return;
    }

    // Validar contraseña fuerte
    if (!isPasswordValid) {
      setError(
        "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial"
      );
      return;
    }

    // Validar que coincidan
    if (!isConfirmPasswordValid) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setError(null);
    console.log("Usuario registrado:", formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            required
            fullWidth
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!usernameError}
            helperText={usernameError || ""}
          />
        </Grid>

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

        <Grid size={12}>
          <TextField
            required
            fullWidth
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={!!passwordError || (formData.password !== "" && !isPasswordValid)}
            helperText={
              passwordError
                ? passwordError
                : formData.password !== "" && !isPasswordValid
                ? "Debe tener 8 caracteres, mayúscula, minúscula, número y símbolo"
                : ""
            }
          />
        </Grid>

        <Grid size={12}>
          <TextField
            required
            fullWidth
            label="Confirmar Contraseña"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={ !isConfirmPasswordValid}
            helperText={ !isConfirmPasswordValid
                ? "Las contraseñas no coinciden"
                : ""
            }
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
        Registrarse
      </Button>
    </Box>
  );
};

export default RegisterForm;