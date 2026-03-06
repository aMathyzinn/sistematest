import type { ChatMessage } from '@/lib/types';

// ============================================================
// CLIENTE OPENROUTER (STREAMING)
// ============================================================

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

export async function streamChat(
  messages: { role: string; content: string }[],
  callbacks: StreamCallbacks,
  options: {
    apiKey: string;
    model: string;
    signal?: AbortSignal;
  }
): Promise<void> {
  const { apiKey, model, signal } = options;

  if (!apiKey) {
    callbacks.onError(new Error('Chave de API não configurada. Vá em Configurações para adicionar sua chave OpenRouter.'));
    return;
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-OpenRouter-Title': 'Sistema de Evolução Pessoal',
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages,
        temperature: 0.4,
        max_tokens: 1024,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string; code?: number } };
      const apiMsg = errorData?.error?.message || '';
      
      // Traduzir erros comuns do OpenRouter
      if (response.status === 401 || apiMsg.toLowerCase().includes('user not found')) {
        throw new Error('Chave de API inválida. Verifique sua chave em Configurações ou gere uma nova em openrouter.ai');
      }
      if (response.status === 402) {
        throw new Error('Saldo insuficiente no OpenRouter. Adicione créditos em openrouter.ai');
      }
      if (response.status === 429) {
        throw new Error('Muitas requisições. Aguarde um momento e tente novamente.');
      }
      if (apiMsg.toLowerCase().includes('model') && apiMsg.toLowerCase().includes('not found')) {
        throw new Error(`Modelo "${model}" não encontrado no OpenRouter. Verifique o nome do modelo em Configurações.`);
      }
      throw new Error(apiMsg || `Erro ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Stream não disponível');

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (!trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          callbacks.onDone(fullText);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            callbacks.onChunk(content);
          }

          // Checar erro mid-stream
          if (parsed.choices?.[0]?.finish_reason === 'error') {
            throw new Error('Erro durante geração da resposta');
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue; // chunk parcial
          throw e;
        }
      }
    }

    callbacks.onDone(fullText);
  } catch (error) {
    if ((error as Error).name === 'AbortError') return;
    callbacks.onError(error instanceof Error ? error : new Error('Erro desconhecido'));
  }
}

// Fallback: resposta sem streaming (para modelos que não suportam)
export async function chatCompletion(
  messages: { role: string; content: string }[],
  options: { apiKey: string; model: string }
): Promise<string> {
  const { apiKey, model } = options;

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
      'X-OpenRouter-Title': 'Sistema de Evolução Pessoal',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: { message?: string } })?.error?.message || `Erro ${response.status}`
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Helper para converter ChatMessage[] para o formato da API
export function formatMessagesForAPI(
  systemPrompt: string,
  messages: ChatMessage[]
): { role: string; content: string }[] {
  return [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];
}
