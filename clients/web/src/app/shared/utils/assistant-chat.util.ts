export function extractAssistantText(result: Record<string, unknown>): string {
  const response = result['response'];
  if (typeof response === 'string' && response.length > 0) {
    return response;
  }
  const summary = result['summary'];
  if (typeof summary === 'string' && summary.length > 0) {
    return summary;
  }
  return JSON.stringify(result, null, 2);
}

export function nextChatMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
