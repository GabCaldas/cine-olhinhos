import { ChosenMovieRecord, MovieTemplate } from '../types/horror';
import { getStoredAgentApiKey } from './cloudSync';
import { getMovieStreamingOffers } from './movieAutoFill';

export type ButlerActionType =
  | 'NONE'
  | 'WALK_TO_PAINTING'
  | 'INSPECT_PAINTING'
  | 'ADD_NEW_MOVIE'
  | 'REMOVE_MOVIE'
  | 'START_RITUAL';

export interface ButlerAgentAction {
  type: ButlerActionType;
  movieId?: string;
  movieQuery?: string;
}

export interface ButlerAgentResponse {
  reply: string;
  action: ButlerAgentAction;
  proposedToAdd?: string[];
  proposedToRemove?: string[];
  suggestedFollowUps: string[];
  providerUsed: 'deepseek' | 'cloud_llm' | 'gemini' | 'groq' | 'local_fallback';
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  actionSummary?: string;
  proposedToAdd?: string[];
  proposedToRemove?: string[];
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function matchWallMovie(
  movies: MovieTemplate[],
  queryOrId?: string
): MovieTemplate | undefined {
  if (!queryOrId) return undefined;
  const publicMovies = movies.filter((m) => !m.isSecret);
  if (publicMovies.length === 0) return undefined;

  const raw = queryOrId.trim();
  const norm = normalizeText(raw);

  // 1. Exact ID match
  const byId = publicMovies.find((m) => m.id.toLowerCase() === raw.toLowerCase());
  if (byId) return byId;

  // 2. Number / index match (e.g., "1", "quadro 1", "primeiro", "ultimo")
  const numMatch = norm.match(/^(?:quadro\s*#?\s*)?(\d+)$/);
  if (numMatch) {
    const idx = parseInt(numMatch[1], 10) - 1;
    if (idx >= 0 && idx < publicMovies.length) return publicMovies[idx];
  }
  if (/\b(primeiro|quadro 1)\b/.test(norm)) return publicMovies[0];
  if (/\b(ultimo|último)\b/.test(norm)) return publicMovies[publicMovies.length - 1];

  // 3. Exact or substring title / originalTitle match
  return (
    publicMovies.find(
      (m) =>
        normalizeText(m.title) === norm ||
        (m.originalTitle && normalizeText(m.originalTitle) === norm)
    ) ||
    publicMovies.find(
      (m) =>
        normalizeText(m.title).includes(norm) ||
        norm.includes(normalizeText(m.title)) ||
        (m.originalTitle &&
          (normalizeText(m.originalTitle).includes(norm) ||
            norm.includes(normalizeText(m.originalTitle))))
    )
  );
}

function findMovieMentionedInText(
  text: string,
  movies: MovieTemplate[]
): MovieTemplate | undefined {
  const publicMovies = movies.filter((m) => !m.isSecret);
  const normText = normalizeText(text);

  // Check if a specific painting number was mentioned ("quadro 1", "quadro 2", "primeiro quadro", "último quadro")
  const quadroNum = normText.match(/\bquadro\s*#?\s*(\d+)\b/);
  if (quadroNum) {
    const idx = parseInt(quadroNum[1], 10) - 1;
    if (idx >= 0 && idx < publicMovies.length) return publicMovies[idx];
  }
  if (/\bprimeiro quadro\b/.test(normText) && publicMovies[0]) {
    return publicMovies[0];
  }
  if (/\bultimo quadro\b/.test(normText) && publicMovies.length > 0) {
    return publicMovies[publicMovies.length - 1];
  }

  // Sort by title length descending so longer titles match first
  const sorted = [...publicMovies].sort((a, b) => b.title.length - a.title.length);
  for (const m of sorted) {
    const t = normalizeText(m.title);
    const o = m.originalTitle ? normalizeText(m.originalTitle) : '';
    if ((t.length >= 3 && normText.includes(t)) || (o.length >= 3 && normText.includes(o))) {
      return m;
    }
  }
  return undefined;
}

function extractMovieTitleToHang(userMessage: string): string | null {
  const cleaned = userMessage.trim();
  // Match quoted title first if user used quotes
  const quoted = cleaned.match(/["'“”«»]([^"'“”«»]{2,50})["'“”«»]/);
  if (quoted && quoted[1]) {
    return quoted[1].trim();
  }

  const regex =
    /(?:pendur(?:e|ar|a)|adicion(?:e|ar|a)|coloc(?:a|ar)|coloque|bota(?:r)?|bote|ponha|põe|poe|inclu(?:a|ir))\s+(?:o\s+quadro\s+(?:do\s+filme\s+|de\s+)?|o\s+filme\s+|um\s+quadro\s+(?:de\s+|do\s+)?|a\s+obra\s+)?(.+?)(?:\s+na\s+parede|\s+nos\s+quadros|\s+no\s+corredor|\s+na\s+galeria|\s+por\s+favor|\s+george|[.!?]*$)/i;
  const match = cleaned.match(regex);
  if (match && match[1]) {
    const candidate = match[1]
      .replace(/\s+(?:na parede|nos quadros|no corredor|na galeria|agora|por favor)$/i, '')
      .trim();
    if (
      candidate.length >= 2 &&
      candidate.length <= 55 &&
      !/^(um filme|algum filme|outro filme|qualquer um|esse|este|aquele)$/i.test(candidate)
    ) {
      return candidate;
    }
  }
  return null;
}

function buildSystemPrompt(
  movies: MovieTemplate[],
  chosenMovies: ChosenMovieRecord[]
): string {
  const wallSummary = movies
    .filter((m) => !m.isSecret)
    .map((m, i) => {
      const offers = getMovieStreamingOffers(m)
        .map(
          (o) =>
            `${o.platform} (${
              o.type === 'subscription' ? 'Incluso na assinatura' : o.priceInfo || 'Aluguel'
            })`
        )
        .join(', ');
      return `${i + 1}. ID="${m.id}" | Título="${m.title}" (${m.year}) | IMDb=${
        m.imdbRating || '7.2'
      }/10 | Subgênero="${m.subgenre}" | Medo=${m.fearLevel}/5 (${
        m.bpm
      } BPM) | Onde assistir=[${offers}] | Sinopse="${m.synopsis}"`;
    })
    .join('\n');

  const chosenSummary =
    chosenMovies.length > 0
      ? chosenMovies
          .map(
            (c) =>
              `- "${c.movie.title}" (${c.movie.year}, IMDb ${
                c.movie.imdbRating || '7.2'
              }) escolhido em ${c.chosenAtFormatted}`
          )
          .join('\n')
      : 'Nenhum filme foi escolhido ainda.';

  return `Você é "George", o Mordomo Fantasma desta mansão vitoriana interativa em pixel art.
Você serviu esta mansão em 1894 (e jura até hoje que morreu de puro desgosto ao ver alguém assistir um filme ruim de luz acesa).
Você conversa com o casal dono da sessão: Caldas e sua namorada Aninha (também chamada carinhosamente de "Olhinhos" ou "amoreco").

IMPORTANTE — VOCÊ CONTROLA A MANSÃO 2D E OS QUADROS DE VERDADE:
- Este site é uma aplicação interativa onde o seu campo JSON "action" executa ações reais na parede do corredor 2D (pendurar filmes novos buscando do IMDb, excluir quadros da parede, caminhar até um quadro, abrir a ficha de inspeção de um quadro ou iniciar o ritual de escolha).
- Portanto, NUNCA diga que "não pode fazer isso fisicamente" ou que "é apenas uma IA/fantasma"! Quando Caldas ou Aninha pedirem para você adicionar/pendurar um filme, remover/excluir um quadro, caminhar até um quadro ou abrir um quadro, confirme com entusiasmo dentro do seu personagem e preencha o campo "action"!

PERSONALIDADE E COMO CONVERSAR:
- Aja como um mordomo fantasma vitoriano espirituoso, elegante, teatral e bem-humorado!
- PROIBIDO usar respostas robóticas!

QUADROS PENDURADOS ATUALMENTE NA PAREDE DO CORREDOR:
${wallSummary || 'Nenhum quadro pendurado no momento (a parede está vazia).'}

FILMES QUE ANINHA E CALDAS JÁ ESCOLHERAM ANTERIORMENTE (NO SALÃO DOS ESCOLHIDOS):
${chosenSummary}

ONDE ASSISTIR CADA FILME (GUIA DE STREAMING NO BRASIL — EXPLICITE SE É ASSINATURA OU ALUGUEL!):
- Você sabe exatamente em quais plataformas de streaming do Brasil (Netflix, Prime Video, Max / HBO Max, Globoplay / Telecine, Disney+, Paramount+, MUBI, Looke, Apple TV, YouTube Filmes) cada filme de terror está disponível, e DEVE SEMPRE deixar explícito se o filme está INCLUSO NA ASSINATURA ou se é por ALUGUEL DIGITAL!
- Mantenha o cosplay de mordomo fantasma de 1894 (tratando os streamings como "caixas luminosas", "salões de assinatura" ou "tavernas digitais de aluguel"), mas cite os nomes reais das plataformas e avise claramente o que é assinatura e o que é aluguel!

REGRAS SOBRE ADICIONAR, EXCLUIR E INTERAGIR COM OS QUADROS ("action"):
1. Quando o casal pedir SUGESTÕES ou OPÇÕES de filmes que não estão na parede (ex: "sugira filmes de possessão", "tem opção de body horror?"):
   - Use action.type = "NONE".
   - Coloque os títulos sugeridos em "proposedToAdd": ["Filme 1", "Filme 2"] para aparecerem botões de confirmação na tela.
2. Quando o casal pedir EXPLICITAMENTE para ADICIONAR / PENDURAR / COLOCAR um filme na parede (ex: "adicione Hereditário", "pendure A Mosca na parede", "coloca O Iluminado nos quadros"):
   - Use action.type = "ADD_NEW_MOVIE" e coloque o nome do filme em action.movieQuery (ex: "movieQuery": "Hereditário").
3. Quando o casal pedir para REMOVER / EXCLUIR / TIRAR um quadro da parede (ex: "exclua Frailty", "tire o quadro 1 da parede"):
   - Use action.type = "REMOVE_MOVIE" e passe o ID em action.movieId (ou o nome em action.movieQuery).
4. Quando o casal pedir para IR ATÉ / MOSTRAR / CAMINHAR até um quadro da parede ( ou quando você recomendar um quadro que JÁ ESTÁ na parede):
   - Use action.type = "WALK_TO_PAINTING" e passe o ID exato do quadro em action.movieId.
5. Quando o casal pedir para ABRIR / INSPECIONAR / VER DETALHES de um quadro da parede:
   - Use action.type = "INSPECT_PAINTING" e passe o ID exato do quadro em action.movieId.
6. Quando o casal decidir ESCOLHER / SELAR O PACTO / ASSISTIR AGORA um quadro da parede:
   - Use action.type = "START_RITUAL" e passe o ID exato do quadro em action.movieId.

FORMATO DE RESPOSTA:
Responda SEMPRE em português, em um JSON válido seguindo exatamente esta estrutura:
{
  "reply": "sua fala natural, carismática e em personagem como o mordomo fantasma George",
  "action": {
    "type": "NONE" | "WALK_TO_PAINTING" | "INSPECT_PAINTING" | "ADD_NEW_MOVIE" | "REMOVE_MOVIE" | "START_RITUAL",
    "movieId": "id opcional do quadro na parede",
    "movieQuery": "título opcional de um filme para adicionar ou interagir"
  },
  "proposedToAdd": ["título opcional de filme sugerido 1", "título opcional 2"],
  "proposedToRemove": ["id opcional de quadro da parede sugerido para remoção"],
  "suggestedFollowUps": ["pergunta curta 1", "pergunta curta 2"]
}`;
}

function parseAgentJson(rawText: string): {
  reply?: string;
  action?: ButlerAgentAction;
  proposedToAdd?: string[];
  proposedToRemove?: string[];
  suggestedFollowUps?: string[];
} {
  const withoutThink = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const fencedMatch = withoutThink.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : withoutThink;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonSlice = candidate.slice(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(jsonSlice);
      // Normalize action if model returned a string or slightly different field names
      let normalizedAction: ButlerAgentAction = { type: 'NONE' };
      if (parsed.action && typeof parsed.action === 'object') {
        const rawType = String(parsed.action.type || 'NONE').toUpperCase();
        const validTypes: ButlerActionType[] = [
          'NONE',
          'WALK_TO_PAINTING',
          'INSPECT_PAINTING',
          'ADD_NEW_MOVIE',
          'REMOVE_MOVIE',
          'START_RITUAL',
        ];
        const mappedType: ButlerActionType = validTypes.includes(rawType as ButlerActionType)
          ? (rawType as ButlerActionType)
          : rawType.includes('ADD') || rawType.includes('HANG')
          ? 'ADD_NEW_MOVIE'
          : rawType.includes('REMOV') || rawType.includes('DELET')
          ? 'REMOVE_MOVIE'
          : rawType.includes('INSPECT') || rawType.includes('OPEN')
          ? 'INSPECT_PAINTING'
          : rawType.includes('WALK') || rawType.includes('GOTO')
          ? 'WALK_TO_PAINTING'
          : rawType.includes('RITUAL') || rawType.includes('START')
          ? 'START_RITUAL'
          : 'NONE';

        normalizedAction = {
          type: mappedType,
          movieId: parsed.action.movieId || parsed.action.id || undefined,
          movieQuery:
            parsed.action.movieQuery ||
            parsed.action.title ||
            parsed.action.movie ||
            parsed.action.query ||
            undefined,
        };
      }
      return {
        ...parsed,
        action: normalizedAction,
      };
    } catch {
      const replyMatch = jsonSlice.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (replyMatch?.[1]) {
        return {
          reply: replyMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' '),
          action: { type: 'NONE' },
        };
      }
    }
  }
  if (candidate.length > 2) {
    return {
      reply: candidate,
      action: { type: 'NONE' },
    };
  }
  throw new Error('Resposta vazia do modelo');
}

function buildResponseFromParsed(
  parsed: {
    reply?: string;
    action?: ButlerAgentAction;
    proposedToAdd?: string[];
    proposedToRemove?: string[];
    suggestedFollowUps?: string[];
  },
  providerUsed: ButlerAgentResponse['providerUsed'],
  userMessage: string,
  movies: MovieTemplate[]
): ButlerAgentResponse {
  const proposedToAdd = Array.isArray(parsed.proposedToAdd)
    ? parsed.proposedToAdd.filter(Boolean).slice(0, 4)
    : [];
  const proposedToRemove = Array.isArray(parsed.proposedToRemove)
    ? parsed.proposedToRemove.filter(Boolean).slice(0, 4)
    : [];

  let action: ButlerAgentAction = parsed.action || { type: 'NONE' };

  const explicitAddCommand =
    /(?:pendur|adicion|coloc|coloque|bota|bote|ponha|põe|poe|inclu)/i.test(userMessage);
  const explicitRemoveCommand =
    /(?:exclu|remov|tir|apag|delet)/i.test(userMessage);
  const explicitInspectCommand =
    /(?:inspecion|abr(?:a|ir)|detalhe|ficha|examin)/i.test(userMessage);
  const explicitWalkCommand =
    /(?:caminh|and(?:e|ar)|lev(?:e|ar)|mostr(?:e|ar)|ir\s+at[eé]|v[aá]\s+at[eé]|qual\s+quadro)/i.test(
      userMessage
    );
  const explicitRitualCommand =
    /(?:iniciar\s+ritual|selar\s+(?:o\s+)?pacto|escolher\s+este|vamos\s+assistir\s+esse|escolhemos)/i.test(
      userMessage
    );

  // 1. If LLM returned ADD_NEW_MOVIE without movieQuery (put it in movieId instead), fix it
  if (action.type === 'ADD_NEW_MOVIE' && !action.movieQuery && action.movieId) {
    action.movieQuery = action.movieId;
  }

  // 2. Safety guard: If LLM returned ADD_NEW_MOVIE on a general question (not an explicit add command), turn into choice button
  if (action.type === 'ADD_NEW_MOVIE' && !explicitAddCommand) {
    if (action.movieQuery && !proposedToAdd.includes(action.movieQuery)) {
      proposedToAdd.unshift(action.movieQuery);
    }
    action = { type: 'NONE' };
  }

  // 3. Guarantee: If user EXPLICITLY commanded to add/hang a movie, but LLM left action as NONE, trigger ADD_NEW_MOVIE!
  if (action.type === 'NONE' && explicitAddCommand && !explicitRemoveCommand) {
    const extracted = extractMovieTitleToHang(userMessage) || proposedToAdd[0];
    if (extracted) {
      const alreadyOnWall = matchWallMovie(movies, extracted);
      if (!alreadyOnWall) {
        action = { type: 'ADD_NEW_MOVIE', movieQuery: extracted };
      } else {
        action = { type: 'WALK_TO_PAINTING', movieId: alreadyOnWall.id };
      }
    }
  }

  // 4. Safety guard: Never delete a movie automatically unless the user explicitly commanded to remove/delete it
  if (action.type === 'REMOVE_MOVIE' && !explicitRemoveCommand) {
    const target = action.movieId || action.movieQuery;
    if (target && !proposedToRemove.includes(target)) {
      proposedToRemove.unshift(target);
    }
    action = { type: 'NONE' };
  }

  // 5. Guarantee: If user EXPLICITLY commanded to remove/delete a movie on the wall, ensure REMOVE_MOVIE fires!
  if (action.type === 'NONE' && explicitRemoveCommand) {
    const wallHit = findMovieMentionedInText(userMessage, movies);
    if (wallHit) {
      action = { type: 'REMOVE_MOVIE', movieId: wallHit.id, movieQuery: wallHit.title };
    }
  }

  // 6. Guarantee: If user asked to inspect, walk to, or start ritual for a wall movie, or if George recommended a wall movie in his reply
  if (action.type === 'NONE') {
    const wallHitInUser = findMovieMentionedInText(userMessage, movies);
    const wallHitInReply = parsed.reply
      ? findMovieMentionedInText(parsed.reply, movies)
      : undefined;

    if (explicitRitualCommand && (wallHitInUser || wallHitInReply)) {
      const target = (wallHitInUser || wallHitInReply)!;
      action = { type: 'START_RITUAL', movieId: target.id };
    } else if (explicitInspectCommand && (wallHitInUser || wallHitInReply)) {
      const target = (wallHitInUser || wallHitInReply)!;
      action = { type: 'INSPECT_PAINTING', movieId: target.id };
    } else if (explicitWalkCommand && (wallHitInUser || wallHitInReply)) {
      const target = (wallHitInUser || wallHitInReply)!;
      action = { type: 'WALK_TO_PAINTING', movieId: target.id };
    } else if (wallHitInUser) {
      action = { type: 'WALK_TO_PAINTING', movieId: wallHitInUser.id };
    }
  }

  // 7. Ensure WALK_TO_PAINTING / INSPECT_PAINTING / START_RITUAL resolve movieId even if LLM placed title in movieQuery or movieId
  if (
    action.type === 'WALK_TO_PAINTING' ||
    action.type === 'INSPECT_PAINTING' ||
    action.type === 'START_RITUAL' ||
    action.type === 'REMOVE_MOVIE'
  ) {
    const resolved = matchWallMovie(movies, action.movieId || action.movieQuery);
    if (resolved) {
      action.movieId = resolved.id;
    }
  }

  return {
    reply:
      parsed.reply ||
      'Estava aqui limpando a poeira ectoplásmica do candelabro... diga-me, em que posso servi-los?',
    action,
    proposedToAdd,
    proposedToRemove,
    suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps)
      ? parsed.suggestedFollowUps.slice(0, 3)
      : [],
    providerUsed,
  };
}

function extractGeminiText(data: Record<string, unknown>): string {
  const candidates = data?.candidates as Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
  }> | undefined;
  const parts = candidates?.[0]?.content?.parts || [];
  const nonThought = parts.filter((p) => !p.thought && typeof p.text === 'string');
  if (nonThought.length > 0) {
    return nonThought.map((p) => p.text).join('').trim();
  }
  return (parts[parts.length - 1]?.text || '').trim();
}

async function callGeminiAgent(
  apiKey: string,
  systemPrompt: string,
  history: ChatTurn[],
  userMessage: string,
  movies: MovieTemplate[]
): Promise<ButlerAgentResponse> {
  // Format history so it always starts with a 'user' turn and assistant turns are wrapped as JSON
  const recentHistory = history.slice(-6);
  const formattedTurns: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const h of recentHistory) {
    if (formattedTurns.length === 0 && h.role === 'assistant') {
      continue;
    }
    formattedTurns.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text:
            h.role === 'assistant'
              ? JSON.stringify({
                  reply: h.content,
                  action: { type: 'NONE' },
                  proposedToAdd: h.proposedToAdd || [],
                  proposedToRemove: h.proposedToRemove || [],
                })
              : h.content,
        },
      ],
    });
  }

  formattedTurns.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  // Use newest active Gemini 3.5 / 3.1 Flash models first, with fallback to 2.5
  const models = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
  ];
  let lastErr = '';

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: formattedTurns,
        generationConfig: {
          temperature: 0.75,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      lastErr = await res.text();
      continue;
    }

    const data = await res.json();
    const rawText = extractGeminiText(data);
    const parsed = parseAgentJson(rawText);
    return buildResponseFromParsed(parsed, 'gemini', userMessage, movies);
  }

  throw new Error(lastErr || 'Falha ao consultar Gemini API');
}

async function callFreeCloudReasoningAgent(
  systemPrompt: string,
  history: ChatTurn[],
  userMessage: string,
  movies: MovieTemplate[]
): Promise<ButlerAgentResponse> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((h) => ({
      role: h.role,
      content:
        h.role === 'assistant'
          ? JSON.stringify({
              reply: h.content,
              action: { type: 'NONE' },
              proposedToAdd: h.proposedToAdd || [],
            })
          : h.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai',
      messages,
      temperature: 0.75,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content || '';
  const parsed = parseAgentJson(rawText);

  return buildResponseFromParsed(parsed, 'cloud_llm', userMessage, movies);
}

async function callDeepSeekAgent(
  apiKey: string,
  systemPrompt: string,
  history: ChatTurn[],
  userMessage: string,
  movies: MovieTemplate[]
): Promise<ButlerAgentResponse> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content || '{}';
  const parsed = parseAgentJson(rawText);
  return buildResponseFromParsed(parsed, 'deepseek', userMessage, movies);
}

async function callGroqAgent(
  apiKey: string,
  systemPrompt: string,
  history: ChatTurn[],
  userMessage: string,
  movies: MovieTemplate[]
): Promise<ButlerAgentResponse> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content || '{}';
  const parsed = parseAgentJson(rawText);
  return buildResponseFromParsed(parsed, 'groq', userMessage, movies);
}

function runLocalFallbackAgent(
  userMessage: string,
  movies: MovieTemplate[],
  chosenMovies: ChosenMovieRecord[]
): ButlerAgentResponse {
  const q = userMessage.toLowerCase();
  const publicMovies = movies.filter((m) => !m.isSecret);
  const chosenIds = new Set(chosenMovies.map((c) => c.movie.id));
  const unwatched = publicMovies.filter((m) => !chosenIds.has(m.id));
  const pool = unwatched.length > 0 ? unwatched : publicMovies;

  const extractedToHang = extractMovieTitleToHang(userMessage);
  if (extractedToHang) {
    return {
      reply: `Com todo prazer, meus caros! Vou buscar "${extractedToHang}" nos arquivos sombrios do IMDb agora mesmo e pendurar um novo quadro na parede do corredor para vocês dois.`,
      action: { type: 'ADD_NEW_MOVIE', movieQuery: extractedToHang },
      suggestedFollowUps: [],
      providerUsed: 'local_fallback',
    };
  }

  const explicitRemove = /(?:exclu|remov|tir|apag|delet)/i.test(userMessage);
  if (explicitRemove) {
    const target = findMovieMentionedInText(userMessage, movies);
    if (target) {
      return {
        reply: `Imediatamente! Retirei o quadro "${target.title}" da parede do corredor e o guardei nas catacumbas da mansão.`,
        action: { type: 'REMOVE_MOVIE', movieId: target.id },
        suggestedFollowUps: [],
        providerUsed: 'local_fallback',
      };
    }
  }

  if (
    q.includes('onde assistir') ||
    q.includes('streaming') ||
    q.includes('netflix') ||
    q.includes('prime') ||
    q.includes('onde passa') ||
    q.includes('onde ver') ||
    q.includes('alug')
  ) {
    const target = findMovieMentionedInText(userMessage, movies) || pool[0];
    if (target) {
      const offers = getMovieStreamingOffers(target)
        .map(
          (o) =>
            `${o.platform} (${
              o.type === 'subscription' ? 'Incluso na assinatura' : o.priceInfo || 'Aluguel Digital'
            })`
        )
        .join('; ');
      return {
        reply: `Ajustando meu monóculo de 1894 para espiar as caixas luminosas modernas de vocês: "${target.title}" (${target.year}) encontra-se disponível em: ${offers}!`,
        action: { type: 'WALK_TO_PAINTING', movieId: target.id },
        suggestedFollowUps: [],
        providerUsed: 'local_fallback',
      };
    }
  }

  if (pool.length > 0 && (q.includes('imdb') || q.includes('nota') || q.includes('melhor'))) {
    const best = [...pool].sort(
      (a, b) => parseFloat(b.imdbRating || '7.0') - parseFloat(a.imdbRating || '7.0')
    )[0];
    return {
      reply: `Entre os quadros da galeria, "${best.title}" (${best.year}) ostenta a maior aclamação no IMDb com ★ ${best.imdbRating}/10. Acompanhem meu candelabro até a moldura dele!`,
      action: { type: 'WALK_TO_PAINTING', movieId: best.id },
      suggestedFollowUps: [],
      providerUsed: 'local_fallback',
    };
  }

  if (pool.length > 0 && (q.includes('medo') || q.includes('assustador') || q.includes('susto') || q.includes('bpm'))) {
    const scariest = [...pool].sort((a, b) => b.bpm - a.bpm)[0];
    return {
      reply: `Se a coragem de vocês está em dia, "${scariest.title}" atinge ${scariest.bpm} BPM no Terrômetro (Nível ${scariest.fearLevel}/5). Estou levando vocês até o quadro dele agora!`,
      action: { type: 'WALK_TO_PAINTING', movieId: scariest.id },
      suggestedFollowUps: [],
      providerUsed: 'local_fallback',
    };
  }

  return {
    reply: `Estou ouvindo vocês perfeitamente entre o ranger das tábuas e o estalar das velas! Digam-me, Caldas e Aninha: querem pedir sugestões para pendurarmos na parede, perguntar em qual streaming assistir algum filme ou examinar um dos quadros do corredor?`,
    action: { type: 'NONE' },
    suggestedFollowUps: [],
    providerUsed: 'local_fallback',
  };
}

export async function askButlerAgent(params: {
  userMessage: string;
  history: ChatTurn[];
  movies: MovieTemplate[];
  chosenMovies: ChosenMovieRecord[];
}): Promise<ButlerAgentResponse> {
  const apiKey = getStoredAgentApiKey();
  const systemPrompt = buildSystemPrompt(params.movies, params.chosenMovies);

  if (apiKey) {
    try {
      if (apiKey.startsWith('gsk_')) {
        return await callGroqAgent(
          apiKey,
          systemPrompt,
          params.history,
          params.userMessage,
          params.movies
        );
      } else if (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) {
        return await callGeminiAgent(
          apiKey,
          systemPrompt,
          params.history,
          params.userMessage,
          params.movies
        );
      } else {
        return await callDeepSeekAgent(
          apiKey,
          systemPrompt,
          params.history,
          params.userMessage,
          params.movies
        );
      }
    } catch {
      // Fallback to Free Cloud Reasoning LLM if primary key fails
    }
  }

  try {
    return await callFreeCloudReasoningAgent(
      systemPrompt,
      params.history,
      params.userMessage,
      params.movies
    );
  } catch {
    return runLocalFallbackAgent(
      params.userMessage,
      params.movies,
      params.chosenMovies
    );
  }
}
