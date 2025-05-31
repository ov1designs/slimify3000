import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'gemini';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { input } = await request.json();
    
    if (!input) {
      return json({ error: 'No input provided' }, { status: 400 });
    }

    let result;
    if (AI_PROVIDER === 'claude' && CLAUDE_API_KEY) {
      result = await processWithClaude(input);
    } else if (GEMINI_API_KEY) {
      result = await processWithGemini(input);
    } else {
      return json({ error: 'AI service not configured' }, { status: 500 });
    }

    return json(result);
  } catch (error) {
    console.error('AI processing error:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Failed to process request' 
    }, { status: 500 });
  }
};

async function processWithGemini(input: string) {
  const prompt = getExercisePrompt(input);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates[0]?.content?.parts[0]?.text || '';
  
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Failed to parse AI response');
  }
}

async function processWithClaude(input: string) {
  const prompt = getExercisePrompt(input);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Claude API error:', error);
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.content[0]?.text || '';
  
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Failed to parse AI response');
  }
}

function getExercisePrompt(input: string): string {
  return `Parse this exercise description and return ONLY a JSON object with this exact structure:
{
  "exercise": {
    "activity": "activity name",
    "duration": duration in minutes as number,
    "intensity": "light" | "moderate" | "intense"
  }
}

Exercise description: "${input}"

If no duration is specified, assume 30 minutes. Determine intensity based on the activity type and any modifiers mentioned.
Response must be valid JSON only, no additional text.`;
} 