<script>
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { widgetConfig } from '../utils/stores.js';

  const dispatch = createEventDispatcher();

  function sendQuickMessage(question) {
    dispatch('sendQuickMessage', question);
  }
</script>

<div class="quick-messages-flow" transition:fade={{ duration: 300 }}>
  {#each $widgetConfig.predefinedQuestions as question (question)}
    <button class="quick-message-btn" on:click={() => sendQuickMessage(question)} disabled={$widgetConfig.isDemo}>
      {question}
    </button>
  {/each}
</div>

<style>
.quick-messages-flow {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding: 0 10px 10px;
  background-color: var(--messages-bg);
  flex-shrink: 0;
  /* Custom scrollbar for better aesthetics */
  scrollbar-width: thin;
  scrollbar-color: var(--disclaimer-text) transparent;
}

.quick-messages-flow::-webkit-scrollbar {
  height: 5px;
}

.quick-messages-flow::-webkit-scrollbar-track {
  background: transparent;
}

.quick-messages-flow::-webkit-scrollbar-thumb {
  background-color: var(--disclaimer-text);
  border-radius: 10px;
}

.quick-message-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid var(--disclaimer-text);
  background-color: transparent;
  color: var(--primary-text-color);
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.quick-message-btn:hover:not(:disabled) {
  background-color: var(--container-bg);
}

.quick-message-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>