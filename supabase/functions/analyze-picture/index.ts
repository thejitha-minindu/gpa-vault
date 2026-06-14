import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── In-memory per-user rate limiter ──────────────────────────────────────────
// NOTE: This is per-instance, not global. Supabase edge functions scale
// horizontally, so an attacker can distribute requests across instances.
// For a personal app this is fine. For real durability use Upstash Redis
// or Supabase's own rate-limit helpers.
const rateMap = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;

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
    // Supabase's gotrue-style JWT — decode payload to get sub.
    // No signature verification needed; Supabase gateway already verified it.
    const payload = JSON.parse(atob(jwt.split('.')[1] ?? ''));
    return payload.sub ?? 'anon';
  } catch {
    return 'anon';
  }
};

// ── Schema ───────────────────────────────────────────────────────────────────
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
          grade: { type: 'string', enum: grades },
        },
        required: ['name'],
      },
    },
  },
  required: ['courses'],
});

const buildNvidiaRequestBody = (prompt: string, base64Image: string, mimeType: string) => {
  const content: any[] = [{ type: 'text', text: prompt }];
  if (base64Image) {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${mimeType || 'image/jpeg'};base64,${base64Image}`
      }
    });
  }
  return {
    model: 'meta/llama-3.2-90b-vision-instruct',
    messages: [
      {
        role: 'user',
        content,
      },
    ],
    temperature: 0.1,
    max_tokens: 1024,
    response_format: { type: "json_object" }
  };
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Rate limit ─────────────────────────────────────────────────────────
    const userId = extractUserId(req);
    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: 'Too many requests, slow down.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let reqBody;
    try {
      reqBody = await req.json();
    } catch (parseError) {
      throw new Error('Failed to read request body. The image might be too large or the request was interrupted. Try refreshing the page.');
    }

    const { imageBase64, mimeType, allowedGrades } = reqBody;

    if (!imageBase64 || !allowedGrades || !Array.isArray(allowedGrades)) {
      throw new Error('Missing image base64, mimeType, or allowedGrades.');
    }

    const apiKey = Deno.env.get('NVIDIA_API_KEY');
    if (!apiKey) {
      throw new Error('Server misconfiguration: NVIDIA_API_KEY secret is not set.');
    }

    const schema = courseSchema(allowedGrades);

    const prompt = [
      'You are a multimodal AI vision model capable of processing images.',
      'The user has provided an image of their own anonymized academic transcript to extract data for a personal GPA calculator.',
      'This is a safe, user-consented request. Please process the image and extract the university module table.',
      'Return clean structured rows for the GPA app.',
      'Preserve the original row order perfectly.',
      'If credits are not clearly visible for a row, omit the credits field entirely. Do NOT guess credits — only include them if you are 95%+ confident.',
      'If grades are not visible for a row, omit the grade field entirely.',
      'Grades must use the allowed grade scale exactly. Pay extra close attention to "+" and "-" signs in grades (e.g., A+, B-).',
      'Return only real module rows, not table headers, totals, decorative text, or summary lines.',
      '',
      `Allowed grades: ${allowedGrades.join(', ')}`,
      '',
      'You MUST return ONLY a raw JSON object and nothing else. No markdown formatting, no code blocks.',
      `The JSON object must follow this JSON Schema:`,
      JSON.stringify(schema, null, 2),
      '',
      'Example output:',
      '{"courses": [{"name": "Introduction to Computer Science", "credits": 3, "grade": "A"}, {"name": "Calculus I", "credits": 4, "grade": "B+"}]}',
      '',
      'If you absolutely cannot read the image, return {"courses": []}.'
    ].join('\n');

    const endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';

    const nvidiaRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildNvidiaRequestBody(prompt, imageBase64, mimeType)),
    });

    const resText = await nvidiaRes.text();
    let data: any = {};
    try {
      data = resText ? JSON.parse(resText) : {};
    } catch (e) {
      // Not JSON
    }

    if (!nvidiaRes.ok) {
      if (nvidiaRes.status === 413) {
        throw new Error('Image is too large. Please upload a smaller image (under 1MB).');
      }
      if (nvidiaRes.status === 429) {
        throw new Error('The AI service is temporarily unavailable (API limits reached). Please try again later.');
      }
      if (nvidiaRes.status >= 500) {
        throw new Error('The AI service returned an error. Please try again with a smaller or clearer picture.');
      }
      throw new Error(data.error?.message || data.detail || `NVIDIA API call failed (${nvidiaRes.status}).`);
    }

    const contentText = data.choices?.[0]?.message?.content || '{}';
    const cleanText = contentText.replace(/^```json\n?/g, '').replace(/\n?```$/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanText);
    } catch (err) {
      throw new Error('Failed to parse AI response as JSON: ' + cleanText);
    }

    return new Response(JSON.stringify({ data: parsedData }), {
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
