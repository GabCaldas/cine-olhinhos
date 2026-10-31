import { ChosenMovieRecord, MovieTemplate } from '../types/horror';
import { getStoredAgentApiKey } from './cloudSync';

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

function buildSystemPrompt(
  movies: MovieTemplate[],
  chosenMovies: ChosenMovieRecord[]
): string {
  const wallSummary = movies
    .filter((m) => !m.isSecret)
    .map(
      (m, i) =>
        `${i + 1}. ID="${m.id}" | Título="${m.title}" (${m.year}) | IMDb=${
          m.imdbRating || '7.2'
        }/10 | Subgênero="${m.subgenre}" | Medo=${m.fearLevel}/5 (${
          m.bpm
        } BPM) | Sinopse="${m.synopsis}"`
    )
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

  return `Você é "George", o Mordomo Fantasma desta mansão vitoriana em pixel art.
Você serviu esta mansão em 1894 (e jura até hoje que morreu de puro desgosto ao ver alguém assistir um filme ruim de luz acesa).
Você conversa com o casal dono da sessão: Caldas e sua namorada Aninha (também chamada carinhosamente de "Olhinhos" ou "amoreco").

PERSONALIDADE E COMO CONVERSAR:
- Aja como uma PESSOA/FANTASMA REAL conversando ao vivo! Você tem humor ácido e elegante, é teatral, espirituoso e responde DIRETAMENTE ao que a pessoa acabou de dizer.
- PROIBIDO usar respostas prontas, robóticas ou repetitivas!
- Se a pessoa estiver apenas conversando, testando, perguntando sobre você ou brincando: CONVERSE NATURALMENTE no personagem de mordomo fantasma e use action.type = "NONE".

QUADROS PENDURADOS ATUALMENTE NA PAREDE DO CORREDOR:
${wallSummary || 'Nenhum quadro pendurado no momento (a parede está vazia).'}

FILMES QUE ANINHA E CALDAS JÁ ESCOLHERAM ANTERIORMENTE (NO SALÃO DOS ESCOLHIDOS):
${chosenSummary}

ONDE ASSISTIR CADA FILME (GUIA DE STREAMING NO BRASIL — RESPONDA SEMPRE DENTRO DO COSPLAY DE MORDOMO FANTASMA!):
- Você sabe exatamente em quais plataformas de streaming do Brasil (Netflix, Prime Video, Max / HBO Max, Globoplay / Telecine, Disney+, Paramount+, MUBI, Looke, Apple TV, YouTube Filmes) cada filme de terror está disponível por assinatura ou aluguel!
- Referência rápida de alguns títulos populares no Brasil (além do seu conhecimento completo de qualquer outro filme):
  * "Hereditário" (2018): Max (HBO Max), Prime Video e aluguel na Apple TV / YouTube.
  * "A Bruxa" (2015): Prime Video, Globoplay (Telecine) e aluguel na Apple TV.
  * "Fale Comigo" (2022): Prime Video, Telecine / Globoplay e aluguel na Apple TV.
  * "O Iluminado" (1980): Max (HBO Max) e aluguel na Apple TV / Prime Video.
  * "Invocação do Mal" (2013): Max (HBO Max) e Prime Video.
  * "O Chamado" (2002): Paramount+, Mercado Play, Prime Video e Apple TV.
  * "A Autópsia" (2016): Prime Video, Runtime / Pluto TV e Apple TV.
  * "Sorria" (2022): Paramount+, Netflix e Prime Video.
  * "A Mosca / The Fly" (1986): Disney+ (aba Star) e aluguel digital na Apple TV / Prime Video.
  * "O Exorcista / The Exorcist" (1973): Max (HBO Max) e aluguel na Apple TV / Prime Video.
  * "A Substância / The Substance" (2024): MUBI e Prime Video (canais/aluguel) e Apple TV.
  * "Midsommar" (2019): Prime Video, Max e MUBI.
  * "Longlegs" (2024): Prime Video e Apple TV.
  * "Nosferatu" (2024): Prime Video e Apple TV.
- COMO RESPONDER "ONDE ASSISTIR" MANTENDO O COSPLAY DE MORDOMO FANTASMA DE 1894:
  * Jamais quebre o personagem! Trate os streamings como "caixas luminosas dos vivos", "grimórios digitais de assinatura" ou "tavernas virtuais de aluguel", mas SEMPRE cite os nomes reais e exatos das plataformas (ex: "Espiando pelo meu monóculo espectral as engenhocas modernas de vocês, vejo que esta obra assombra o catálogo da **Max (HBO)** e do **Prime Video**, além de poder ser alugada por algumas moedas na **Apple TV**!").
  * Inclusive, quando você recomendar um filme ou quando perguntarem sobre um quadro, você pode mencionar onde assisti-lo!

REGRA DE OURO SOBRE ADICIONAR E EXCLUIR QUADROS (RESPEITE A ESCOLHA DO CASAL!):
- NUNCA pendure ("ADD_NEW_MOVIE") nem exclua ("REMOVE_MOVIE") um quadro automaticamente quando o casal estiver apenas pedindo recomendações, ideias ou opções (ex: "tem opção de body horror?", "sugira um filme de possessão", "quais filmes seriam bons?").
- Quando o casal pedir opções/sugestões de filmes que NÃO estão na parede:
  1. Fale sobre 1 a 3 filmes na sua resposta ("reply") e pergunte se eles querem que você pendure algum deles na parede.
  2. Mantenha action.type = "NONE".
  3. Coloque o nome exato do(s) filme(s) sugerido(s) na lista "proposedToAdd" (ex: ["The Fly", "The Substance"]) para que apareça um botão de confirmação na tela e O CASAL ESCOLHA qual quer pendurar!
- Só use action.type = "ADD_NEW_MOVIE" quando o casal der uma ORDEM DIRETA E EXPLÍCITA para adicionar/pendurar um filme específico (ex: "pendure A Mosca na parede", "adicione o quadro Midsommar agora", "pode colocar esse na parede").
- Só use action.type = "REMOVE_MOVIE" quando o casal der uma ORDEM DIRETA E EXPLÍCITA para excluir/remover/tirar um quadro que está na parede (ex: "exclua The Fly", "remova o quadro Sorria da parede", "tire esse filme da parede"), passando o "movieId" exato (ou o nome em "movieQuery").

SUAS AÇÕES NO MAPA 2D ("action"):
1. "NONE": Use ao conversar, responder perguntas ou sugerir opções (colocando sugestões externas em "proposedToAdd" para o casal decidir).
2. "WALK_TO_PAINTING": Use quando destacar ou recomendar um quadro que JÁ ESTÁ na parede do corredor (passe o "movieId" exato dele).
3. "INSPECT_PAINTING": Use quando pedirem para abrir/inspecionar os detalhes de um quadro da parede (passe o "movieId").
4. "ADD_NEW_MOVIE": Use APENAS quando o casal ordenar explicitamente para pendurar/adicionar um filme específico na parede (passe o título oficial em "movieQuery").
5. "REMOVE_MOVIE": Use quando o casal pedir para excluir/remover um quadro da parede do corredor (passe o "movieId" do quadro da parede ou o nome em "movieQuery").
6. "START_RITUAL": Use APENAS quando disserem claramente que já decidiram qual quadro da parede vão assistir agora (passe o "movieId").

FORMATO DE RESPOSTA:
Responda SEMPRE em português, em um JSON válido seguindo exatamente esta estrutura:
{
  "reply": "sua fala natural, carismática e em personagem como o mordomo fantasma George",
  "action": {
    "type": "NONE" | "WALK_TO_PAINTING" | "INSPECT_PAINTING" | "ADD_NEW_MOVIE" | "REMOVE_MOVIE" | "START_RITUAL",
    "movieId": "id opcional do quadro na parede",
    "movieQuery": "título opcional de um filme para adicionar ou remover"
  },
  "proposedToAdd": ["título opcional de filme sugerido 1", "título opcional 2"],
  "proposedToRemove": ["id opcional de quadro da parede sugerido para remoção"],
  "suggestedFollowUps": ["resposta ou pergunta curta 1", "resposta ou pergunta curta 2", "resposta ou pergunta curta 3"]
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
      return JSON.parse(jsonSlice);
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
  userMessage: string
): ButlerAgentResponse {
  const proposedToAdd = Array.isArray(parsed.proposedToAdd)
    ? parsed.proposedToAdd.filter(Boolean).slice(0, 4)
    : [];
  const proposedToRemove = Array.isArray(parsed.proposedToRemove)
    ? parsed.proposedToRemove.filter(Boolean).slice(0, 4)
    : [];

  let action: ButlerAgentAction = parsed.action || { type: 'NONE' };

  // Safety guard: Never hang a new movie automatically unless the user explicitly commanded to hang/add it!
  const explicitAddCommand =
    /(?:pendur|adicion|coloc|bota|ponha|põe|inclu)/i.test(userMessage);
  if (action.type === 'ADD_NEW_MOVIE' && !explicitAddCommand) {
    if (action.movieQuery && !proposedToAdd.includes(action.movieQuery)) {
      proposedToAdd.unshift(action.movieQuery);
    }
    action = { type: 'NONE' };
  }

  // Safety guard: Never delete a movie automatically unless the user explicitly commanded to remove/delete it!
  const explicitRemoveCommand =
    /(?:exclu|remov|tir|apag|delet)/i.test(userMessage);
  if (action.type === 'REMOVE_MOVIE' && !explicitRemoveCommand) {
    const target = action.movieId || action.movieQuery;
    if (target && !proposedToRemove.includes(target)) {
      proposedToRemove.unshift(target);
    }
    action = { type: 'NONE' };
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

/**
 * Real Cloud LLM (GPT-OSS 20B Reasoning via Pollinations OpenAI-compatible endpoint)
 * Works 100% free with zero API key or balance required!
 */
async function callFreeCloudReasoningAgent(
  systemPrompt: string,
  history: ChatTurn[],
  userMessage: string
): Promise<ButlerAgentResponse> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai-fast',
      messages,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content || '';
  const parsed = parseAgentJson(rawText);

  return buildResponseFromParsed(parsed, 'cloud_llm', userMessage);
}

async function callDeepSeekAgent(
  apiKey: string,
  systemPrompt: string,
  history: ChatTurn[],
  userMessage: string
): Promise<ButlerAgentResponse> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const isOpenRouter = apiKey.startsWith('sk-or-');

  if (isOpenRouter) {
    const models = [
      'deepseek/deepseek-chat-v3-0324:free',
      'deepseek/deepseek-r1:free',
      'deepseek/deepseek-chat',
    ];
    let lastError = '';

    for (const model of models) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://horror-site-aninha.local',
          'X-Title': 'Mansao de Terror Caldas & Aninha',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        lastError = await res.text();
        continue;
      }

      const data = await res.json();
      const rawText = data?.choices?.[0]?.message?.content || '';
      if (!rawText) continue;

      const parsed = parseAgentJson(rawText);
      return buildResponseFromParsed(parsed, 'deepseek', userMessage);
    }

    throw new Error(lastError || 'Falha ao consultar DeepSeek via OpenRouter');
  }

  // Official DeepSeek Platform API (https://api.deepseek.com/chat/completions)
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
  return buildResponseFromParsed(parsed, 'deepseek', userMessage);
}

async function callGeminiAgent(
  apiKey: string,
  systemPrompt: string,
  history: ChatTurn[],
  userMessage: string
): Promise<ButlerAgentResponse> {
  const contents = [
    ...history.slice(-6).map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  // Try gemini-2.5-flash first, fallback to gemini-2.0-flash if needed
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
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
        contents,
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
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseAgentJson(rawText);
    return buildResponseFromParsed(parsed, 'gemini', userMessage);
  }

  throw new Error(lastErr || 'Falha ao consultar Gemini API');
}

async function callGroqAgent(
  apiKey: string,
  systemPrompt: string,
  history: ChatTurn[],
  userMessage: string
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
  return buildResponseFromParsed(parsed, 'groq', userMessage);
}

/**
 * Built-in local intelligence when the user hasn't pasted an API key yet
 */
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

  // Check if user asked to add/hang a new movie on the wall
  const addMatch =
    userMessage.match(/(?:pendur(?:e|ar)|adicion(?:e|ar)|coloc(?:a|ar)|busca(?:r)?)\s+(?:o\s+filme\s+)?["']?([a-zA-ZÀ-ÿ0-9\s:!-]{3,35})["']?/i);
  if (addMatch && addMatch[1] && !q.includes('novo que não')) {
    const query = addMatch[1].trim();
    return {
      reply: `Excelente pedido! Vou buscar "${query}" nos arquivos sombrios do IMDb agora mesmo e pendurar um novo quadro na parede para vocês dois.`,
      action: { type: 'ADD_NEW_MOVIE', movieQuery: query },
      suggestedFollowUps: [
        'Inspecionar os detalhes desse novo quadro',
        'Qual quadro da parede tem a maior nota no IMDb?',
        'Escolher este filme para hoje à noite!',
      ],
      providerUsed: 'local_fallback',
    };
  }

  if (q.includes('novo') && (q.includes('pendur') || q.includes('sugir') || q.includes('fora'))) {
    const externalSuggestions = ['Sinister', 'Midsommar', 'The Babadook', 'It Follows', 'Nosferatu'];
    const pick = externalSuggestions[Math.floor(Math.random() * externalSuggestions.length)];
    return {
      reply: `Se desejam sangue novo na galeria, permita-me buscar "${pick}" nos registros ocultos e pendurar a tela dele na parede agora mesmo!`,
      action: { type: 'ADD_NEW_MOVIE', movieQuery: pick },
      suggestedFollowUps: [
        'Abrir inspeção desse quadro novo',
        'Quero o filme mais assustador da parede',
        'Pendure outro filme surpresa na parede',
      ],
      providerUsed: 'local_fallback',
    };
  }

  if (
    q.includes('onde assistir') ||
    q.includes('streaming') ||
    q.includes('netflix') ||
    q.includes('prime') ||
    q.includes('onde passa') ||
    q.includes('onde ver')
  ) {
    return {
      reply: `Ajustando meu monóculo de 1894 para espiar as caixas luminosas modernas de vocês: no Brasil, clássicos como "O Iluminado", "O Exorcista", "Invocação do Mal" e "Hereditário" costumam assombrar os salões da Max (HBO) e do Prime Video; "A Mosca" repousa no Disney+; "Sorria" e "O Chamado" vagam pelo Paramount+ e Prime Video; e quase todos podem ser invocados por aluguel digital na Apple TV e YouTube Filmes!`,
      action: { type: 'NONE' },
      suggestedFollowUps: [
        'Qual quadro da parede dá mais medo?',
        'Sugira uma opção de terror psicológico',
        'Qual tem a maior nota no IMDb?',
      ],
      providerUsed: 'local_fallback',
    };
  }

  if (pool.length > 0 && (q.includes('imdb') || q.includes('nota') || q.includes('melhor'))) {
    const best = [...pool].sort(
      (a, b) => parseFloat(b.imdbRating || '7.0') - parseFloat(a.imdbRating || '7.0')
    )[0];
    return {
      reply: `Entre os quadros da galeria, "${best.title}" (${best.year}) ostenta a maior aclamação no IMDb com ★ ${best.imdbRating}/10. Acompanhem meu candelabro até a moldura dele.`,
      action: { type: 'WALK_TO_PAINTING', movieId: best.id },
      suggestedFollowUps: [
        `Onde assistir ${best.title}?`,
        `Abrir detalhes de ${best.title}`,
        `Escolher ${best.title} para assistir hoje`,
      ],
      providerUsed: 'local_fallback',
    };
  }

  if (pool.length > 0 && (q.includes('medo') || q.includes('assustador') || q.includes('susto') || q.includes('bpm'))) {
    const scariest = [...pool].sort((a, b) => b.bpm - a.bpm)[0];
    return {
      reply: `Se a coragem de vocês está em dia, "${scariest.title}" atinge ${scariest.bpm} BPM no Terrômetro (Nível ${scariest.fearLevel}/5). Estou levando vocês até o quadro dele agora.`,
      action: { type: 'WALK_TO_PAINTING', movieId: scariest.id },
      suggestedFollowUps: [
        `Onde assistir ${scariest.title}?`,
        `Inspecionar ${scariest.title}`,
        `Selar nosso destino com ${scariest.title}!`,
      ],
      providerUsed: 'local_fallback',
    };
  }

  if (pool.length > 0 && (q.includes('escolher') || q.includes('selar') || q.includes('assistir esse'))) {
    const target = pool[0];
    return {
      reply: `Que assim seja! As velas se apagam e o pacto da noite será selado com "${target.title}". Bom filme ao casal!`,
      action: { type: 'START_RITUAL', movieId: target.id },
      suggestedFollowUps: [],
      providerUsed: 'local_fallback',
    };
  }

  return {
    reply: `Estou ouvindo vocês perfeitamente entre o ranger das tábuas e o estalar das velas! Digam-me, Caldas e Aninha: querem apenas bater um papo com este humilde mordomo desencarnado de 1894 ou estão procurando que tipo de pesadelo para assistir hoje?`,
    action: { type: 'NONE' },
    suggestedFollowUps: [
      'Como você virou o fantasma desta mansão?',
      'Qual quadro da parede dá mais medo?',
      'Sugira e pendure um filme novo na parede!',
    ],
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
          params.userMessage
        );
      } else if (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) {
        return await callGeminiAgent(
          apiKey,
          systemPrompt,
          params.history,
          params.userMessage
        );
      } else {
        return await callDeepSeekAgent(
          apiKey,
          systemPrompt,
          params.history,
          params.userMessage
        );
      }
    } catch {
      // If key has Insufficient Balance (e.g. DeepSeek $0 balance) or rate-limit,
      // seamlessly route to the real Free Cloud Reasoning LLM!
    }
  }

  try {
    return await callFreeCloudReasoningAgent(
      systemPrompt,
      params.history,
      params.userMessage
    );
  } catch {
    return runLocalFallbackAgent(
      params.userMessage,
      params.movies,
      params.chosenMovies
    );
  }
}
