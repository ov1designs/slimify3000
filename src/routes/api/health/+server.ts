import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const hasGeminiKey = !!import.meta.env.VITE_GEMINI_API_KEY;
  const hasClaudeKey = !!import.meta.env.VITE_CLAUDE_API_KEY;
  const aiProvider = import.meta.env.VITE_AI_PROVIDER || 'not configured';
  
  return json({
    status: 'ok',
    ai: {
      provider: aiProvider,
      configured: (aiProvider === 'gemini' && hasGeminiKey) || (aiProvider === 'claude' && hasClaudeKey)
    }
  });
}; 