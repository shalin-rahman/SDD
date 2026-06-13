import { extractAssistantText, nextChatMessageId } from '../utils/assistant-chat.util';

describe('assistant-chat.util', () => {
  it('extractAssistantText prefers response field', () => {
    expect(extractAssistantText({ response: 'Hello' })).toBe('Hello');
  });

  it('extractAssistantText falls back to summary', () => {
    expect(extractAssistantText({ summary: 'Done' })).toBe('Done');
  });

  it('nextChatMessageId returns unique ids', () => {
    const a = nextChatMessageId();
    const b = nextChatMessageId();
    expect(a).not.toBe(b);
    expect(a.startsWith('msg-')).toBeTrue();
  });
});
