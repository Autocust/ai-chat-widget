<script>
  import { createEventDispatcher, getContext } from 'svelte';
  import { _ } from '../i18n';

  const widgetConfig = getContext('widgetConfig');
  const dispatch = createEventDispatcher();

  function resetChat() {
    dispatch('resetChat');
  }

  function toggleChat() {
    dispatch('toggleChat');
  }
</script>

<div id="chat-header">
  <div>{widgetConfig.title ?? $_('widget.title')}{widgetConfig.isDemo ? ` ${$_('widget.demoSuffix')}` : ''}</div>
  <div class="header-buttons">
    <button id="reset-chat" on:click={resetChat} title={$_('widget.resetTitle')} aria-label={$_('widget.resetTitle')}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg></button>
    {#if widgetConfig.closable}
      <button id="close-chat" on:click={toggleChat} title={$_('widget.closeTitle')} aria-label={$_('widget.closeTitle')}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
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
.header-buttons { display: flex; gap: 0px; }
#reset-chat, #close-chat {
  background: none; border: none; color: var(--header-text);
  font-size: 20px; line-height: 1; padding: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  height: 40px;
}
</style>