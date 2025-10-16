<svelte:options accessors={true} />
<script>
  import { onMount, tick } from 'svelte';
  import Message from './Message.svelte';
  import DateSeparator from './DateSeparator.svelte';
  import { widgetConfig, chatState } from '../utils/stores.js';

  let messagesContainer;
  let showScrollButton = false;

  export { messagesContainer as element };

  export async function prepareForStreaming() {
    await tick();
    if (!messagesContainer) return;

    const messageElements = messagesContainer.querySelectorAll('.message-container.user-message');
    if (messageElements.length === 0) return;

    const lastUserMessageElement = messageElements[messageElements.length - 1];
    if (lastUserMessageElement) {
      const messageHeight = lastUserMessageElement.offsetHeight;
      const containerHeight = messagesContainer.offsetHeight;

      messagesContainer.style.paddingBottom = '0px';

      if (messageHeight > containerHeight) {
        const offsetTop = lastUserMessageElement.offsetTop;
        messagesContainer.scrollTo({ top: offsetTop, behavior: 'smooth' });
      } else {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }

  /**
   * Cleans up the spacer element after streaming is done.
   * This should be called after the last message has been processed.
   */
  export function cleanupAfterStreaming() {
    if (!messagesContainer) return;

    const messageElements = messagesContainer.querySelectorAll('.message-container');
    if (messageElements.length === 0) {
      messagesContainer.style.paddingBottom = '0px';
      return;
    }

    messagesContainer.style.paddingBottom = '0px';
  }

  /**
   * Scrolls the messages container to the bottom.
   * @param {string} behavior - The scroll behavior ('smooth' or 'auto').
   */
  async function scrollToEnd(behavior = 'smooth') {
    await tick();
    if (messagesContainer) {
      messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior });
    }
  }

  function handleScroll() {
    if (!messagesContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    showScrollButton = distanceFromBottom > 1000;
  }

  onMount(() => {
    messagesContainer.addEventListener('scroll', handleScroll);
    if (!$widgetConfig.isDemo) {
      scrollToEnd('auto');
    }
    return () => {
      if (messagesContainer) {
        messagesContainer.removeEventListener('scroll', handleScroll);
      }
    };
  });

  // Scroll to end when loading state appears, so user sees "Thinking..."
  $: if ($chatState.loadingState && $chatState.loadingState.message) {
    if (!$widgetConfig.isDemo) {
      scrollToEnd('smooth');
    }
  }
</script>

<div id="chat-messages-wrapper">
  <div id="chat-messages" aria-live="polite" bind:this={messagesContainer}>
    {#each $chatState.messages as message, i (
      message.type === 'date' ? 'date:' + message.date : i
    )}
      {#if message.type === 'date'}
        <DateSeparator date={message.date} />
      {:else}
        <Message {message} />
      {/if}
    {/each}
    {#if !$widgetConfig.isDemo && $chatState.loadingState?.message}
      <div class="loading-container" aria-live="assertive">
        <div class="loading-indicator">
          <span class="loading-text">{$chatState.loadingState.message}</span>
          <div class="typing-dots"><span></span><span></span><span></span></div>
        </div>
      </div>
    {/if}
  </div>
  {#if showScrollButton}
    <button class="scroll-to-bottom" on:click={() => scrollToEnd()}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m0 0l-4-4m4 4l4-4"/></svg>
    </button>
  {/if}
</div>

<style>
#chat-messages-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}
#chat-messages {
  display: flex;
  flex-direction: column;
  flex-grow: 1; overflow-y: auto; padding: 10px;
  background-color: var(--messages-bg); color: var(--primary-text-color);
  scrollbar-gutter: stable both-edges;
}

.scroll-to-bottom {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--chat-btn-bg, #000);
  color: var(--chat-btn-text, #fff);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: opacity 0.3s, transform 0.3s;
  opacity: 0.8;
}

.scroll-to-bottom:hover {
  opacity: 1;
  transform: translateX(-50%) scale(1.1);
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