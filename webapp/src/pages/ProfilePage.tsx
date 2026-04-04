import EditRoundedIcon from "@mui/icons-material/EditRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import { useEffect, useState } from "react";
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

async function loadProfile(username: string): Promise<ProfileData> {
  const response = await fetch(`${apiEndpoint}/user/${encodeURIComponent(username)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not load profile information.");
  return data;
}

async function saveProfile(profile: ProfileData): Promise<ProfileData> {
  const response = await fetch(`${apiEndpoint}/user/${encodeURIComponent(profile.username)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: profile.name, surname: profile.surname, email: profile.email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not update profile information.");
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
        const data = await loadProfile(username);
        if (!ignore) { setProfile(data); setFormData(data); }
      } catch (fetchError) {
        if (!ignore) setMessage({
          severity: "error",
          text: fetchError instanceof Error ? fetchError.message : "Could not load profile information.",
        });
      }
    };
    fetchProfile();
    return () => { ignore = true; };
  }, [username]);

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
      const data = await saveProfile({ ...formData, username: displayUsername });
      setProfile(data); setFormData(data); setIsEditing(false);
      setMessage({ severity: "success", text: "Profile updated successfully." });
    } catch (saveError) {
      setMessage({
        severity: "error",
        text: saveError instanceof Error ? saveError.message : "Could not update profile information.",
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
          <SubTitle>Player profile</SubTitle>
          <Title>{displayUsername}</Title>
        </ProfileInfo>
        <ProfileActions direction="row" spacing={1.5}>
          {isEditing ? (
            <>
              <GoldButton variant="outlined" onClick={handleCancel} disabled={isSaving}>Cancel</GoldButton>
              <GoldButton variant="outlined" onClick={handleSave} disabled={isSaving}>Save</GoldButton>
            </>
          ) : (
            <GoldButton variant="outlined" startIcon={<EditRoundedIcon />} onClick={handleEditStart} disabled={!profile}>
              Edit
            </GoldButton>
          )}
        </ProfileActions>
      </ProfileHeader>

      {/* ── Account details ── */}
      <Card>
        <CardTitle>
          <CardIcon />
          Account details
        </CardTitle>
        <Stack spacing={2}>
          <TwoGrid>
            <div>
              <FieldLabel>Username</FieldLabel>
              <FieldValue>{displayUsername}</FieldValue>
            </div>
          </TwoGrid>

          {isEditing ? (
            <>
              <TwoGrid>
                <GoldTextField label="Name" name="name" value={formData.name} onChange={handleFieldChange} disabled={isSaving} size="small" />
                <GoldTextField label="Surname" name="surname" value={formData.surname} onChange={handleFieldChange} disabled={isSaving} size="small" />
              </TwoGrid>
              <TwoGrid>
                <GoldTextField label="Email" name="email" type="email" value={formData.email} onChange={handleFieldChange} disabled={isSaving} size="small" />
              </TwoGrid>
            </>
          ) : (
            <>
              <TwoGrid>
                <div><FieldLabel>Name</FieldLabel><FieldValue>{profile?.name || "—"}</FieldValue></div>
                <div><FieldLabel>Surname</FieldLabel><FieldValue>{profile?.surname || "—"}</FieldValue></div>
              </TwoGrid>
              <TwoGrid>
                <div><FieldLabel>Email</FieldLabel><FieldValue>{profile?.email || "—"}</FieldValue></div>
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
            Change password
          </CardTitle>
          <SubTitle>You will be able to change your password here.</SubTitle>
          <GoldButton variant="outlined" disabled>Change password</GoldButton>
        </BottomCard>

        <BottomCard>
          <CardTitle>
            <HistoryRoundedIcon sx={{ fontSize: "1rem", color: "#c8a84b" }} />
            Match history
          </CardTitle>
          <SubTitle>Review your recent matches and results.</SubTitle>
          <GoldButton variant="outlined" onClick={() => navigate("/history")}>View history</GoldButton>
        </BottomCard>
      </BottomRow>

    </PageWrapper>
  );
}