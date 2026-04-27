import { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import { useNavigate, Navigate } from "react-router-dom";
import { useSession } from "../SessionContext";
import axios from "axios";
import { PageWrapper, DivColumn, Title, SubTitle, EmptyState, EmptyIcon, EmptyText, BackButton, LoadingText } from "../components/CommonComponents";
import { useTranslation } from "react-i18next";

//endpoint
const apiEndpoint = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Types ───────────────────────────────────────────────────
type Result = "won" | "lost";

interface GameSession {
  _id: string;
  userId: string;
  rival: string;
  level: number;
  duration: number;
  result: Result;
  createdAt: string;
}



// ─── Helpers ─────────────────────────────────────────────────
const formatDuration = (seconds: number): string => {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const formatDate = (iso: string, t: (key: string, options?: any) => string): string => {
  const now = new Date();
  const date = new Date(iso);

  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return t('history.time.seconds');
  if (diffMin < 60) return t('history.time.minutes', { n: diffMin });
  if (diffHour < 24) return t('history.time.hours', { n: diffHour });
  if (diffDay < 7) return t('history.time.days', { n: diffDay });

  // Si es más antiguo, mostramos fecha normal
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};


const StatsRow = styled("div")({
  display: "flex",
  gap: 24,
  justifyContent: "center",
});

const StatCard = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "16px 28px",
  border: "1px solid #222",
  borderRadius: 4,
  backgroundColor: "#111",
});

const StatValue = styled("span")({
  fontFamily: "Georgia, serif",
  fontSize: "1.6rem",
  color: "#c8a84b",
  letterSpacing: "0.04em",
});

const StatLabel = styled("span")({
  fontSize: "0.7rem",
  color: "#555",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
});

const TableWrapper = styled("div")({
  width: "100%",
  maxWidth: 1000,
  borderRadius: 4,
  border: "1px solid #1e1e1e",
  overflow: "hidden",
});

const TableHeader = styled("div")({
  display: "grid",
  gridTemplateColumns: "1fr 200px 80px 90px 80px",
  padding: "10px 20px",
  backgroundColor: "#111",
  borderBottom: "1px solid #222",
});

const HeaderCell = styled("span")({
  fontSize: "0.65rem",
  color: "#444",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
});

const TableRow = styled("div")<{ result: Result }>(({ result }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 200px 80px 90px 80px",
  padding: "14px 20px",
  borderBottom: "1px solid #161616",
  alignItems: "center",
  transition: "background-color 0.15s ease",
  borderLeft: `2px solid ${result === "won" ? "#4a7c59" : "#7c4a4a"}`,
  "&:last-child": {
    borderBottom: "none",
  },
  "&:hover": {
    backgroundColor: "#131313",
  },
}));

const Cell = styled("span")({
  fontSize: "0.82rem",
  color: "#888",
  letterSpacing: "0.03em",
});

const RivalBadge = styled("span")<{ rival: string }>(({ rival }) => ({
  fontSize: "0.72rem",
  padding: "3px 8px",
  borderRadius: 2,
  letterSpacing: "0.05em",
  backgroundColor:
  rival === "multiplayer" ? "rgba(100, 140, 200, 0.08)" : "rgba(200, 168, 75, 0.08)",
  color: rival === "multiplayer" ? "#6a9cc8" : "#c8a84b",
  border: `1px solid ${rival === "multiplayer" ? "rgba(100,140,200,0.2)" : "rgba(200,168,75,0.2)" }`,
}));

const ResultBadge = styled("span")<{ result: Result }>(({ result }) => ({
  fontSize: "0.72rem",
  padding: "3px 8px",
  borderRadius: 2,
  letterSpacing: "0.05em",
  backgroundColor:
    result === "won" ? "rgba(74, 124, 89, 0.1)" : "rgba(124, 74, 74, 0.1)",
  color: result === "won" ? "#6aab7e" : "#ab6a6a",
  border: `1px solid ${result === "won" ? "rgba(74,124,89,0.25)" : "rgba(124,74,74,0.25)"}`,
}));


// ─── Component ───────────────────────────────────────────────
const GameHistory = () => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isLoggedIn, username } = useSession();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('sessionId'); // Obtenemos el token
        
        const res = await axios.get<GameSession[]>(
          `${apiEndpoint}/user/${username}/history`,
          {
            headers: {
              'Authorization': `Bearer ${token}` // Lo enviamos como configuración de axios
            }
          }
        );
        setHistory(res.data);
      } catch (err: any) {
        const backendError = err.response?.data?.error || err.message || t('history.fetchError');        setError(backendError);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchHistory();
  }, [username, t]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const getRivalText = (rival: string) => {
    if (rival === "multiplayer") {
      return `👤 ${t('history.player')}`;
    }
    
    const rivalName = rival === 'bot' ? t('history.bot') : rival;
    return `🤖 ${rivalName}`;
  };

  const wins = history.filter((g) => g.result === "won").length;
  const losses = history.filter((g) => g.result === "lost").length;
  const winRate =
    history.length > 0 ? Math.round((wins / history.length) * 100) : 0;

  return (
    <PageWrapper>
      <DivColumn>
        <Title>{t('history.title')}</Title>
        <SubTitle>{t('history.subtitle')}</SubTitle>
      </DivColumn>

      {!loading && history.length > 0 && (
        <StatsRow>
          <StatCard>
            <StatValue>{history.length}</StatValue>
            <StatLabel>{t('history.played')}</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{wins}</StatValue>
            <StatLabel>{t('history.wins')}</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{losses}</StatValue>
            <StatLabel>{t('history.losses')}</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{winRate}%</StatValue>
            <StatLabel>{t('history.winRate')}</StatLabel>
          </StatCard>
        </StatsRow>
      )}

      {loading && <LoadingText>{t('history.loading')}</LoadingText>}

      {error && (
        <SubTitle style={{ color: "#7c4a4a" }}>
          {t('history.loadError')}
        </SubTitle>
      )}

      {!loading && !error && history.length === 0 && (
        <EmptyState>
          <EmptyIcon>♟</EmptyIcon>
          <EmptyText>{t('history.empty')}</EmptyText>
        </EmptyState>
      )}

      {!loading && !error && history.length > 0 && (
        <TableWrapper>
          <TableHeader>
            <HeaderCell>{t('history.date')}</HeaderCell>
            <HeaderCell>{t('history.rival')}</HeaderCell>
            <HeaderCell>{t('history.level')}</HeaderCell>
            <HeaderCell>{t('history.duration')}</HeaderCell>
            <HeaderCell>{t('history.result')}</HeaderCell>
          </TableHeader>

          {history.map((game) => (
            <TableRow key={game._id} result={game.result}>
              <Cell>{formatDate(game.createdAt, t)}</Cell>
              <Cell>
              <RivalBadge rival={game.rival}>
                {getRivalText(game.rival)}
              </RivalBadge>
              </Cell>
              <Cell style={{ color: "#666" }}>{game.level ?? "—"}</Cell>
              <Cell>{formatDuration(game.duration)}</Cell>
              <Cell>
                <ResultBadge result={game.result}>
                  {game.result === "won" ? t('history.win') : t('history.lose')}
                </ResultBadge>
              </Cell>
            </TableRow>
          ))}
        </TableWrapper>
      )}

      <BackButton onClick={() => navigate("/set")}>{t('history.back')}</BackButton>
    </PageWrapper>
  );
};

export default GameHistory;