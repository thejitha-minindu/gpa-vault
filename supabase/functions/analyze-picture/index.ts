import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── In-memory per-user rate limiter ──────────────────────────────────────────
const rateMap = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 15;

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const hits = (rateMap.get(userId) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) return false;
  hits.push(now);
  rateMap.set(userId, hits);
  return true;
};

const extractUserId = (req: Request): string => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace('Bearer ', '');
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1] ?? ''));
    return payload.sub ?? 'anon';
  } catch {
    return 'anon';
  }
};

// ── Schema Definition ─────────────────────────────────────────────────────────
const courseSchema = (grades: string[]) => ({
  type: 'object',
  properties: {
    courses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          credits: { type: 'number' },
          grade: { type: 'string', enum: grades.length ? grades : undefined },
        },
        required: ['name'],
      },
    },
  },
  required: ['courses'],
});

const buildPrompt = (allowedGrades: string[]) => [
  'You are an expert academic transcript data extraction assistant.',
  'The user has provided an image of their university academic transcript to calculate their GPA.',
  'Extract the course/module records from the transcript image.',
  'Rules:',
  '1. Return only genuine course/module rows. Do NOT extract table headers, degree titles, semester summary GPA lines, or total credit counts.',
  '2. Preserve the original row order exactly as shown in the image.',
  '3. Extract course name (e.g. "Data Structures & Algorithms", "Calculus II").',
  '4. Extract numeric credits / credit units if clearly visible (e.g. 3, 4, 1.5). If not visible or uncertain, omit the credits field.',
  '5. Extract letter grade (e.g. "A+", "A", "B-") and match with the allowed grades.',
  '6. Pay close attention to "+" and "-" signs on grades.',
  '',
  `Allowed grades for this scale: ${allowedGrades.join(', ')}`,
  '',
  'If you cannot find any course entries, return {"courses": []}.'
].join('\n');

const callGemini = async (apiKey: string, prompt: string, schema: any, base64Image: string, mimeType: string) => {
  const trimmedKey = apiKey.trim();

  // Modern Gemini models available for this API key
  const candidateModels = [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest'
  ];

  let lastErrMsg = '';

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-goog-api-key': trimmedKey,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        lastErrMsg = data?.error?.message || `Model ${model} returned HTTP ${res.status}`;
        console.warn(`Gemini model ${model} failed (${res.status}): ${lastErrMsg}`);
        continue;
      }

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        lastErrMsg = `Model ${model} returned empty content`;
        continue;
      }

      return JSON.parse(rawText);
    } catch (err: any) {
      lastErrMsg = err.message;
      console.warn(`Gemini model ${model} threw error:`, err.message);
    }
  }

  throw new Error(`Gemini vision analysis failed: ${lastErrMsg}`);
};

const callNvidia = async (apiKey: string, prompt: string, base64Image: string, mimeType: string) => {
  const endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';
  const models = ['meta/llama-3.2-11b-vision-instruct', 'meta/llama-3.2-90b-vision-instruct'];
  let lastErr: Error | null = null;

  for (const model of models) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt + '\nYou MUST return ONLY valid raw JSON with {"courses": [{"name": "...", "credits": 3, "grade": "A"}]}.' },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType || 'image/jpeg'};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 1024,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.detail || `NVIDIA API error (${res.status})`);
      }

      const content = data?.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from NVIDIA response.');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (err: any) {
      lastErr = err;
      console.warn(`NVIDIA model ${model} failed:`, err.message);
    }
  }

  throw lastErr || new Error('NVIDIA extraction failed.');
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Rate limit ─────────────────────────────────────────────────────────
    const userId = extractUserId(req);
    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: 'Too many requests, please slow down.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let reqBody;
    try {
      reqBody = await req.json();
    } catch (_parseError) {
      throw new Error('Failed to read request body. Image may be too large or corrupted.');
    }

    const { imageBase64, mimeType = 'image/jpeg', allowedGrades = [] } = reqBody;

    if (!imageBase64 || !Array.isArray(allowedGrades)) {
      throw new Error('Missing imageBase64 or allowedGrades.');
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const nvidiaKey = Deno.env.get('NVIDIA_API_KEY');

    if (!geminiKey && !nvidiaKey) {
      throw new Error('Server misconfiguration: GEMINI_API_KEY secret is not set in Supabase.');
    }

    const schema = courseSchema(allowedGrades);
    const prompt = buildPrompt(allowedGrades);

    let parsedData = null;
    let aiError = null;

    // Prioritize Gemini (fastest and structured output)
    if (geminiKey) {
      try {
        parsedData = await callGemini(geminiKey, prompt, schema, imageBase64, mimeType);
      } catch (geminiErr: any) {
        console.error('Gemini attempt failed:', geminiErr.message);
        aiError = geminiErr;
      }
    }

    // Fallback to NVIDIA if Gemini was unavailable or failed
    if (!parsedData && nvidiaKey) {
      try {
        parsedData = await callNvidia(nvidiaKey, prompt, imageBase64, mimeType);
      } catch (nvidiaErr: any) {
        console.error('NVIDIA fallback attempt failed:', nvidiaErr.message);
        if (!aiError) aiError = nvidiaErr;
      }
    }

    if (!parsedData) {
      throw new Error(aiError?.message || 'AI vision analysis failed. Please try a clearer picture.');
    }

    // Normalize courses structure
    let courses = [];
    if (Array.isArray(parsedData)) {
      courses = parsedData;
    } else if (Array.isArray(parsedData.courses)) {
      courses = parsedData.courses;
    } else if (Array.isArray(parsedData.modules)) {
      courses = parsedData.modules;
    } else if (Array.isArray(parsedData.results)) {
      courses = parsedData.results;
    }

    return new Response(JSON.stringify({ data: { courses } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
