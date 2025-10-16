import { writable } from 'svelte/store';

export const widgetConfig = writable({});
export const chatState = writable({
  messages: [],
  isChatVisible: false,
  loadingState: null,
  userInput: '',
  showChatButton: true,
});
