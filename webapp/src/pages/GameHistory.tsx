import { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import { useNavigate, Navigate } from "react-router-dom";
import { useSession } from "../SessionContext";
import axios from "axios";
import { PageWrapper, ContentShell, DivColumn, Title, SubTitle, EmptyState, EmptyIcon, EmptyText, BackButton, LoadingText } from "../components/CommonComponents";
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

// ─── Colores centralizados ────────────────────────────────────
const RESULT_COLORS: Record<Result, { solid: string; muted: string }> = {
  won:  { solid: "#4a7c59", muted: "rgba(74,124,89,0.25)" },
  lost: { solid: "#7c4a4a", muted: "rgba(124,74,74,0.25)" },
};

const rivalColors = (rival: string) =>
  rival === "multiplayer"
    ? { color: "#6a9cc8", bg: "rgba(100,140,200,0.08)", border: "rgba(100,140,200,0.2)" }
    : { color: "#c8a84b", bg: "rgba(200,168,75,0.08)",  border: "rgba(200,168,75,0.2)" };

const resultColors = (result: Result) =>
  result === "won"
    ? { color: "#6aab7e", bg: "rgba(74,124,89,0.1)",  border: RESULT_COLORS.won.muted }
    : { color: "#ab6a6a", bg: "rgba(124,74,74,0.1)", border: RESULT_COLORS.lost.muted };

// ─── Styled components ───────────────────────────────────────
const Badge = styled("span")<{ color: string; bg: string; border: string }>(
  ({ color, bg, border }) => ({
    fontSize: "0.72rem",
    padding: "3px 8px",
    borderRadius: 999,
    letterSpacing: "0.05em",
    backgroundColor: bg,
    color,
    border: `1px solid ${border}`,
  })
);

const StatsRow = styled("div")({
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "clamp(12px, 2vw, 20px)",
});

const StatCard = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "18px 20px",
  border: "1px solid rgba(200, 168, 75, 0.14)",
  borderRadius: 18,
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
  color: "#777",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
});

const TableWrapper = styled("div")(({ theme }) => ({
  width: "100%",
  maxWidth: 1000,
  borderRadius: 22,
  border: "1px solid #1e1e1e",
  overflow: "hidden",
  [theme.breakpoints.down("sm")]: {
    border: "none",
    backgroundColor: "transparent",
  },
}));

const TableHeader = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 200px 80px 90px 80px",
  padding: "10px 20px",
  backgroundColor: "#111",
  borderBottom: "1px solid #222",
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));

const HeaderCell = styled("span")({
  fontSize: "0.65rem",
  color: "#444",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
});

const TableRow = styled("div")<{ result: Result }>(({ result, theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 200px 80px 90px 80px",
  padding: "14px 20px",
  borderBottom: "1px solid #161616",
  alignItems: "center",
  transition: "background-color 0.15s ease",
  borderLeft: `2px solid ${RESULT_COLORS[result].solid}`,
  "&:last-child": { borderBottom: "none" },
  "&:hover": { backgroundColor: "#131313" },
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
    gap: 12,
    padding: "16px",
    marginBottom: 12,
    border: `1px solid ${RESULT_COLORS[result].muted}`,
    borderLeft: `3px solid ${RESULT_COLORS[result].solid}`,
    borderRadius: 18,
    backgroundColor: "#111",
    "&:last-child": { marginBottom: 0 },
  },
}));

const Cell = styled("span")(({ theme }) => ({
  fontSize: "0.82rem",
  color: "#888",
  letterSpacing: "0.03em",
  [theme.breakpoints.down("sm")]: {
    display: "grid",
    gridTemplateColumns: "92px minmax(0, 1fr)",
    gap: 12,
    alignItems: "center",
    "&::before": {
      content: "attr(data-label)",
      fontSize: "0.68rem",
      color: "#666",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
  },
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
        const res = await axios.get<GameSession[]>(
          `${apiEndpoint}/user/${username}/history`
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
  const winRate = history.length > 0 ? Math.round((wins / history.length) * 100) : 0;

  return (
    <PageWrapper>
      <ContentShell>
        <DivColumn>
          <Title>{t('history.title')}</Title>
          <SubTitle>{t('history.subtitle')}</SubTitle>
        </DivColumn>

      </ContentShell>

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
              <Badge {...rivalColors(game.rival)}>
                {getRivalText(game.rival)}
              </Badge>
              </Cell>
              <Cell style={{ color: "#666" }}>{game.level ?? "—"}</Cell>
              <Cell>{formatDuration(game.duration)}</Cell>
              <Cell>
                <Badge {...resultColors(game.result)}>
                  {game.result === "won" ? t('history.win') : t('history.lose')}
                </Badge>
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