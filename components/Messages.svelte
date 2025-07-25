<svelte:options accessors={true} />
<script>
  import Message from './Message.svelte';

  export let messages = [];
  export let isDemo = false;
  export let loadingState = null;
  export let userMessageIcon = null;
  export let botMessageIcon = null;
  export let openInNewTab = true;

  let messagesContainer;
  export { messagesContainer as element };
</script>

<div id="chat-messages" aria-live="polite" bind:this={messagesContainer}>
  {#each messages as message, i (message.sender + message.content.substring(0, 30) + Math.random())}
    <Message {message} {userMessageIcon} {botMessageIcon} {openInNewTab} />
  {/each}
  {#if !isDemo && loadingState?.message}
    <div class="loading-container" aria-live="assertive">
      <div class="loading-indicator">
        <span class="loading-text">{loadingState.message}</span>
        <div class="typing-dots"><span></span><span></span><span></span></div>
      </div>
    </div>
  {/if}
</div>

<style>
#chat-messages {
  flex-grow: 1; overflow-y: auto; padding: 10px;
  background-color: var(--messages-bg); color: var(--primary-text-color);
}

.loading-container {
  display: flex; align-items: center; padding: 8px 12px;
  background-color: var(--loading-bg); border-radius: 16px;
  max-width: fit-content;
  margin: 5px 0;
}
.loading-indicator { display: flex; align-items: baseline; gap: 4px; }
.loading-text { color: var(--loading-text-color); font-size: 14px; }
.typing-dots { display: flex; gap: 2px; padding-bottom: 2px; padding-left: 2px; }
.typing-dots span {
  width: 2px; height: 2px; background-color: var(--loading-dot-color);
  border-radius: 50%; display: inline-block; animation: customBounce 1s infinite;
}
.typing-dots span:nth-child(1) { animation-delay: 0ms; }
.typing-dots span:nth-child(2) { animation-delay: 200ms; }
.typing-dots span:nth-child(3) { animation-delay: 400ms; }

@keyframes customBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
</style>