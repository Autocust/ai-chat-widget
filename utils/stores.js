import { writable } from 'svelte/store';

export const chatState = writable({
  messages: [],
  isChatVisible: false,
  loadingState: null,
  userInput: '',
  showChatButton: true,
});
