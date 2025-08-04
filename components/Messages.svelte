<svelte:options accessors={true} />
<script>
  import { onMount, tick } from 'svelte';
  import Message from './Message.svelte';
  import DateSeparator from './DateSeparator.svelte';

  export let messages = [];
  export let isDemo = false;
  export let loadingState = null;
  export let userMessageIcon = null;
  export let assistantMessageIcon = null;
  export let humanAgentMessageIcon = null;
  export let openInNewTab = true;
  export let enableUTM = true;

  let messagesContainer;
  let showScrollButton = false;
  let spacerElement;

  export { messagesContainer as element };

  export async function prepareForStreaming() {
    await tick();
    if (!messagesContainer) return;

    const messageElements = messagesContainer.querySelectorAll('.message-container.user-message');
    console.log('Preparing for streaming, found user messages:', messageElements);
    if (messageElements.length === 0) return;

    const lastUserMessageElement = messageElements[messageElements.length - 1];
    console.log('Last user message element:', lastUserMessageElement);
    if (lastUserMessageElement) {
      // --- Measure paddings once (robust for Shadow DOM containers) ---
      const style = getComputedStyle(messagesContainer);
      const padTop = parseFloat(style.paddingTop) || 0;
      const padBottom = parseFloat(style.paddingBottom) || 0;

      console.log('Padding top:', padTop, 'Padding bottom:', padBottom);

      // --- Ensure the spacer exists BEFORE scrolling ---
      if (!spacerElement) {
        spacerElement = document.createElement('div');
        spacerElement.className = 'scroll-spacer'; // keep existing class/CSS
        messagesContainer.appendChild(spacerElement);
      }

      // --- Compute the user's message top relative to the scroll container ---
      // Using the offset chain is more reliable than viewport rects in Shadow DOM contexts.
      let relTop = lastUserMessageElement.offsetTop;
      let node = lastUserMessageElement.offsetParent;
      while (node && node !== messagesContainer) {
        relTop += node.offsetTop;
        node = node.offsetParent;
      }

      // --- Reserve the remaining visible space below the user message ---
      const visibleHeight = messagesContainer.clientHeight - padTop - padBottom;
      const spacerHeight = Math.max(0, visibleHeight - lastUserMessageElement.offsetHeight);
      spacerElement.style.height = `${spacerHeight}px`;

      // --- Now align the user's message to the very top of the scroll container (absolute scrollTop) ---
      const desiredScrollTop = Math.max(0, relTop - padTop);
      messagesContainer.scrollTop = desiredScrollTop;

      // NOTE:
      // - No RAF/loop here. We only set the initial spacer and alignment.
      // - The spacer remains until cleanupAfterStreaming() runs at the true end of streaming.
    }
  }

  /**
   * Cleans up the spacer element after streaming is done.
   * This should be called after the last message has been processed.
   */
  export function cleanupAfterStreaming() {
    if (spacerElement) {
      spacerElement.remove();
      spacerElement = null;
    }
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
    if (!isDemo) {
      scrollToEnd('auto');
    }
    return () => {
      if (messagesContainer) {
        messagesContainer.removeEventListener('scroll', handleScroll);
      }
    };
  });

  // Scroll to end when loading state appears, so user sees "Thinking..."
  $: if (loadingState && loadingState.message) {
    if (!isDemo) {
      scrollToEnd('smooth');
    }
  }
</script>

<div id="chat-messages-wrapper">
  <div id="chat-messages" aria-live="polite" bind:this={messagesContainer}>
    {#each messages as message, i (
      message.type === 'date' ? 'date:' + message.date : i
    )}
      {#if message.type === 'date'}
        <DateSeparator date={message.date} />
      {:else}
        <Message {message} {userMessageIcon} {assistantMessageIcon} {humanAgentMessageIcon} {openInNewTab} {enableUTM} />
      {/if}
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