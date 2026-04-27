import EditRoundedIcon from "@mui/icons-material/EditRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Button, Stack, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useSession } from "../SessionContext";
import { useNavigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────

type ProfileData = {
  username: string;
  name: string;
  surname: string;
  email: string;
};

type ProfileMessage = {
  severity: "error" | "success";
  text: string;
};

// ─── Constants ───────────────────────────────────────────────

const apiEndpoint = import.meta.env.VITE_API_URL || "http://localhost:8000";

const emptyProfile: ProfileData = { username: "", name: "", surname: "", email: "" };

// ─── API ─────────────────────────────────────────────────────

async function loadProfile(username: string, t: (key: string) => string): Promise<ProfileData> {
  // Solo permitimos letras, números, puntos, guiones y guiones bajos
  const isValidUsername = /^[a-zA-Z0-9._-]+$/.test(username);
  
  if (!isValidUsername) {
    throw new Error(t("profile.invalidUsername") || "Invalid username format");
  }

  const token = localStorage.getItem('sessionId'); // Obtenemos el token
  const response = await fetch(`${apiEndpoint}/user/${encodeURIComponent(username)}`, {
    headers: {
      'Authorization': `Bearer ${token}` // Lo enviamos al Gateway
    }
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || t("profile.loadError"))
  }

  return data
}

async function saveProfile(profile: ProfileData, t: (key: string) => string): Promise<ProfileData> {
  if (!/^[a-zA-Z0-9._-]+$/.test(profile.username)) {
    throw new Error(t("profile.invalidUsername"));
  }
  
  const token = localStorage.getItem('sessionId');
  const response = await fetch(`${apiEndpoint}/user/${encodeURIComponent(profile.username)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: profile.name,
      surname: profile.surname,
      email: profile.email,
    }),
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || t("profile.saveError"));
  return data;
}

// ─── Styled components ───────────────────────────────────────

const PageWrapper = styled("div")({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: "#0d0d0d",
  overflowY: "auto",
  padding: "40px 16px 20px 16px",
  gap: 24,
});

const Title = styled("h1")({
  fontFamily: "Georgia, serif",
  fontSize: "1.6rem",
  color: "#e8d89a",
  letterSpacing: "0.08em",
  margin: 0,
});

const SubTitle = styled("p")({
  fontFamily: "Georgia, serif",
  fontSize: "0.85rem",
  color: "#666",
  letterSpacing: "0.05em",
  margin: 0,
});

const Card = styled("div")({
  width: "100%",
  maxWidth: 800,
  backgroundColor: "#111",
  border: "1px solid #222",
  borderRadius: 4,
  padding: "20px 32px",
  boxSizing: "border-box",
  overflow: "hidden",
});

const CardTitle = styled(Typography)({
  fontFamily: "Georgia, serif",
  fontSize: "0.95rem",
  color: "#c8a84b",
  letterSpacing: "0.06em",
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 16,
});

const FieldLabel = styled(Typography)({
  fontSize: "0.7rem",
  color: "#444",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 2,
});

const FieldValue = styled(Typography)({
  fontSize: "0.9rem",
  color: "#888",
  letterSpacing: "0.03em",
});

const GoldButton = styled(Button)({
  padding: "8px 24px",
  fontSize: "0.82rem",
  letterSpacing: "0.06em",
  borderColor: "#c8a84b",
  color: "#c8a84b",
  borderRadius: 4,
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(200, 168, 75, 0.07)",
    borderColor: "#e8d89a",
    color: "#e8d89a",
  },
  "&.Mui-disabled": {
    borderColor: "#2a2a2a",
    color: "#333",
  },
});

const GoldTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 4,
    color: "#e8d89a",
    fontSize: "0.9rem",
    "& fieldset": { borderColor: "rgba(200, 168, 75, 0.3)" },
    "&:hover fieldset": { borderColor: "#c8a84b" },
    "&.Mui-focused fieldset": { borderColor: "#c8a84b" },
  },
  "& .MuiInputLabel-root": {
    color: "#555",
    fontFamily: "Georgia, serif",
    fontSize: "0.85rem",
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#c8a84b" },
});

const MessageBadge = styled("p")<{ severity: "error" | "success" }>(({ severity }) => ({
  fontSize: "0.8rem",
  color: severity === "success" ? "#6aab7e" : "#ab6a6a",
  letterSpacing: "0.03em",
  margin: "8px 0 0",
  padding: "8px 12px",
  backgroundColor: severity === "success" ? "rgba(74,124,89,0.1)" : "rgba(124,74,74,0.1)",
  border: `1px solid ${severity === "success" ? "rgba(74,124,89,0.25)" : "rgba(124,74,74,0.25)"}`,
  borderRadius: 4,
}));

const ProfileHeader = styled("div")({
  width: "100%",
  maxWidth: 800,
  display: "flex",
  alignItems: "center",
  gap: 24,
});

const ProfileAvatar = styled(Avatar)({
  width: 72,
  height: 72,
  backgroundColor: "#1a1a1a",
  border: "2px solid #c8a84b",
  color: "#c8a84b",
  fontSize: "1.8rem",
  fontFamily: "Georgia, serif",
});

const ProfileInfo = styled("div")({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 4,
});

const ProfileActions = styled(Stack)({
  flexShrink: 0,
});

const TwoGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
});

const BottomRow = styled("div")({
  width: "100%",
  maxWidth: 800,
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
});

const BottomCard = styled(Card)({
  flex: 1,
  minWidth: 240,
  maxWidth: "none",
  display: "flex",
  flexDirection: "column",
  gap: 8,
});

const CardIcon = styled(PersonRoundedIcon)({
  fontSize: "1rem",
  color: "#c8a84b",
});

// ─── Component ───────────────────────────────────────────────

export default function ProfilePage() {
  const { username } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileData>(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<ProfileMessage | null>(null);

  useEffect(() => {
    let ignore = false;
    const fetchProfile = async () => {
      if (!username) { setProfile(null); setFormData(emptyProfile); return; }
      try {
        setMessage(null);
        const data = await loadProfile(username, t);
        if (!ignore) { setProfile(data); setFormData(data); }
      } catch (fetchError) {
        if (!ignore) setMessage({
          severity: "error",
          text: fetchError instanceof Error ? fetchError.message : t("profile.loadError"),
        });
      }
    };
    fetchProfile();
    return () => { ignore = true; };
  }, [username, t]);

  const displayUsername = profile?.username || username;

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleEditStart = () => {
    if (!profile) return;
    setFormData(profile); setMessage(null); setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(profile || emptyProfile); setMessage(null); setIsEditing(false);
  };

  const handleSave = async () => {
    if (!displayUsername) return;
    try {
      setIsSaving(true); setMessage(null);
      const data = await saveProfile({ ...formData, username: displayUsername }, t);
      setProfile(data); setFormData(data); setIsEditing(false);
      setMessage({ severity: "success", text: t("profile.saveSuccess") });
    } catch (saveError) {
      setMessage({
        severity: "error",
        text: saveError instanceof Error ? saveError.message : t("profile.saveError"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageWrapper>

      {/* ── Header ── */}
      <ProfileHeader>
        <ProfileAvatar>
          {displayUsername?.slice(0, 1).toUpperCase()}
        </ProfileAvatar>
        <ProfileInfo>
          <SubTitle>{t("profile.playerProfile")}</SubTitle>
          <Title>{displayUsername}</Title>
        </ProfileInfo>
        <ProfileActions direction="row" spacing={1.5}>
          {isEditing ? (
            <>
              <GoldButton variant="outlined" onClick={handleCancel} disabled={isSaving}>{t("profile.cancel")}</GoldButton>
              <GoldButton variant="outlined" onClick={handleSave} disabled={isSaving}>{t("profile.save")}</GoldButton>
            </>
          ) : (
            <GoldButton variant="outlined" startIcon={<EditRoundedIcon />} onClick={handleEditStart} disabled={!profile}>
              {t("profile.edit")}
            </GoldButton>
          )}
        </ProfileActions>
      </ProfileHeader>

      {/* ── Account details ── */}
      <Card>
        <CardTitle>
          <CardIcon />
          {t("profile.accountDetails")}
        </CardTitle>
        <Stack spacing={2}>
          <TwoGrid>
            <div>
              <FieldLabel>{t("profile.username")}</FieldLabel>
              <FieldValue>{displayUsername}</FieldValue>
            </div>
          </TwoGrid>

          {isEditing ? (
            <>
              <TwoGrid>
                <GoldTextField label={t("profile.name")} name="name" value={formData.name} onChange={handleFieldChange} disabled={isSaving} size="small" />
                <GoldTextField label={t("profile.surname")} name="surname" value={formData.surname} onChange={handleFieldChange} disabled={isSaving} size="small" />
              </TwoGrid>
              <TwoGrid>
                <GoldTextField label={t("profile.email")} name="email" type="email" value={formData.email} onChange={handleFieldChange} disabled={isSaving} size="small" />
              </TwoGrid>
            </>
          ) : (
            <>
              <TwoGrid>
                <div><FieldLabel>{t("profile.name")}</FieldLabel><FieldValue>{profile?.name || t("profile.emptyValue")}</FieldValue></div>
                <div><FieldLabel>{t("profile.surname")}</FieldLabel><FieldValue>{profile?.surname || t("profile.emptyValue")}</FieldValue></div>
              </TwoGrid>
              <TwoGrid>
                <div><FieldLabel>{t("profile.email")}</FieldLabel><FieldValue>{profile?.email || t("profile.emptyValue")}</FieldValue></div>
              </TwoGrid>
            </>
          )}

          {message && <MessageBadge severity={message.severity}>{message.text}</MessageBadge>}
        </Stack>
      </Card>

      {/* ── Bottom cards ── */}
      <BottomRow>
        <BottomCard>
          <CardTitle>
            <SecurityRoundedIcon sx={{ fontSize: "1rem", color: "#c8a84b" }} />
            {t("profile.changePassword")}
          </CardTitle>
          <SubTitle>{t("profile.passwordHelp")}</SubTitle>
          <GoldButton variant="outlined" disabled>{t("profile.changePassword")}</GoldButton>
        </BottomCard>

        <BottomCard>
          <CardTitle>
            <HistoryRoundedIcon sx={{ fontSize: "1rem", color: "#c8a84b" }} />
            {t("profile.matchHistory")}
          </CardTitle>
          <SubTitle>{t("profile.historyHelp")}</SubTitle>
          <GoldButton variant="outlined" onClick={() => navigate("/history")}>{t("profile.viewHistory")}</GoldButton>
        </BottomCard>
      </BottomRow>

    </PageWrapper>
  );
}