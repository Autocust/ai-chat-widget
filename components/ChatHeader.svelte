<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from '../i18n';

  export let displayTitle = '';
  export let isDemo = false;
  export let closable = true;

  const dispatch = createEventDispatcher();

  function resetChat() {
    dispatch('resetChat');
  }

  function toggleChat() {
    dispatch('toggleChat');
  }
</script>

<div id="chat-header">
  <div>{displayTitle}{isDemo ? ` ${$_('widget.demoSuffix')}` : ''}</div>
  <div class="header-buttons">
    <button id="reset-chat" on:click={resetChat} title={$_('widget.resetTitle')} aria-label={$_('widget.resetTitle')}>↺</button>
    {#if closable}
      <button id="close-chat" on:click={toggleChat} title={$_('widget.closeTitle')} aria-label={$_('widget.closeTitle')}>×</button>
    {/if}
  </div>
</div>

<style>
#chat-header {
  display: flex; justify-content: space-between; align-items: center;
  background-color: var(--header-bg);
  color: var(--header-text);
  padding: 10px 10px 10px 14px;
  flex-shrink: 0;
}
.header-buttons { display: flex; gap: 5px; }
#reset-chat, #close-chat {
  background: none; border: none; color: var(--header-text);
  font-size: 20px; line-height: 20px; padding: 10px; cursor: pointer;
}
</style>