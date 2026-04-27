import { Container, Typography, Box, Paper } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "../SessionContext";
import ChangePasswordForm from "../components/ChangePasswordForm";

const ChangePassword = () => {
  const { isLoggedIn } = useSession();
  const { t } = useTranslation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container className="yovi-ui" maxWidth="sm">
      <Box
        sx={{
          marginTop: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper className="uiCard" elevation={3} sx={{ padding: 4, width: "100%" }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            {t("profile.changePassword")}
          </Typography>
          <ChangePasswordForm />
        </Paper>
      </Box>
    </Container>
  );
};

export default ChangePassword;
