import { TwitterApi } from 'twitter-api-v2';

const DEFAULT_LIMIT = 3;
const DEFAULT_SORT_BY = 'wins';
const DEFAULT_ORDER = 'desc';
const MAX_POST_LENGTH = 280;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function getPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeBaseUrl(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function fetchRanking() {
  const baseUrl = normalizeBaseUrl(getRequiredEnv('RANKING_API_URL'));
  const limit = getPositiveInteger(process.env.RANKING_LIMIT, DEFAULT_LIMIT);
  const sortBy = process.env.RANKING_SORT_BY?.trim() || DEFAULT_SORT_BY;
  const order = process.env.RANKING_ORDER?.trim() || DEFAULT_ORDER;

  const rankingUrl = new URL('/game/ranking', baseUrl);
  rankingUrl.searchParams.set('sortBy', sortBy);
  rankingUrl.searchParams.set('order', order);
  rankingUrl.searchParams.set('limit', String(limit));

  const response = await fetch(rankingUrl, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Ranking request failed with status ${response.status}`);
  }

  const ranking = await response.json();
  if (!Array.isArray(ranking)) {
    throw new Error('Ranking response must be a JSON array');
  }

  return ranking;
}

function buildRankingLines(ranking) {
  const medals = ['🥇', '🥈', '🥉'];

  return ranking.map((entry, index) => {
    const medal = medals[index] || `#${index + 1}`;
    const winsLabel = entry.wins === 1 ? 'victoria' : 'victorias';
    return `${medal} ${entry.username} - ${entry.wins} ${winsLabel}`;
  });
}

function validateLength(post) {
  if (post.length > MAX_POST_LENGTH) {
    throw new Error(`The generated post exceeds ${MAX_POST_LENGTH} characters`);
  }
}

function buildPostText(ranking) {
  const lines = buildRankingLines(ranking);

  const post = [
    '🏆 Daily Yovi ranking',
    '',
    ...lines,
    '',
    'Who will reach the podium tomorrow? 🔥'
  ].join('\n');

  validateLength(post);
  return post;
}

async function publishToX(text) {
  const client = new TwitterApi({
    appKey: getRequiredEnv('X_API_KEY'),
    appSecret: getRequiredEnv('X_API_SECRET'),
    accessToken: getRequiredEnv('X_ACCESS_TOKEN'),
    accessSecret: getRequiredEnv('X_ACCESS_TOKEN_SECRET')
  });

  const result = await client.v2.tweet(text);
  return result.data;
}

async function main() {
  const ranking = await fetchRanking();
  const dryRun = (process.env.DRY_RUN || '').toLowerCase() === 'true';

  if (ranking.length === 0) {
    console.log('There are no players in the ranking. Nothing will be posted.');
    return;
  }

  const text = buildPostText(ranking);

  console.log('Generated post:\n');
  console.log(text);
  console.log(`\nPost length: ${text.length}`);

  if (dryRun) {
    console.log('\nDRY_RUN=true, skipping publish to X.');
    return;
  }

  const tweet = await publishToX(text);
  console.log(`\nTweet published successfully with id ${tweet.id}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
