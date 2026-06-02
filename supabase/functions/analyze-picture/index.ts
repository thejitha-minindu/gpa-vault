import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

const buildGeminiRequestBody = (prompt: string, schema: any, base64Image: string, mimeType: string) => {
  const parts: any[] = [{ text: prompt }];
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: base64Image
      }
    });
  }
  return {
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  };
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType, allowedGrades } = await req.json();

    if (!imageBase64 || !allowedGrades || !Array.isArray(allowedGrades)) {
      throw new Error('Missing image base64, mimeType, or allowedGrades.');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Server misconfiguration: GEMINI_API_KEY secret is not set.');
    }

    const prompt = [
      'You are an expert data extraction assistant. Extract the university module table from the provided image.',
      'Return clean structured rows for the GPA app.',
      'Preserve the original row order perfectly.',
      'If credits are not visible for a row, omit the credits field entirely.',
      'If grades are not visible for a row, omit the grade field entirely.',
      'Grades must use the allowed grade scale exactly. Pay extra close attention to "+" and "-" signs in grades (e.g., A+, B-).',
      'Return only real module rows, not table headers or decorative text.',
      '',
      `Allowed grades: ${allowedGrades.join(', ')}`,
    ].join('\n');

    const schema = courseSchema(allowedGrades);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildGeminiRequestBody(prompt, schema, imageBase64, mimeType)),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      if (geminiRes.status === 429) {
        throw new Error('The AI service is temporarily unavailable (API limits reached). Please try again later.');
      }
      if (geminiRes.status >= 500) {
        throw new Error('The AI service is currently down. Please try again later.');
      }
      throw new Error(data.error?.message || 'Gemini API call failed.');
    }

    return new Response(JSON.stringify({ data }), {
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
