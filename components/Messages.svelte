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
  let lastMessageCount = 0;
  let spacerElement;

  export { messagesContainer as element };

  export function addSpacer() {
    if (!spacerElement) {
      spacerElement = document.createElement('div');
      spacerElement.className = 'scroll-spacer';
      messagesContainer.appendChild(spacerElement);
    }
  }

  export function removeSpacer() {
    if (spacerElement) {
      spacerElement.remove();
      spacerElement = null;
    }
  }

  export function smartScroll() {
    tick().then(() => {
      if (!messagesContainer) return;

      const messageElements = messagesContainer.querySelectorAll('.message-container');
      const actualMessages = messages.filter(m => m.type !== 'date');
      
      if (messageElements.length === 0 || actualMessages.length === 0) return;

      const lastMessage = actualMessages[actualMessages.length - 1];

      if ((lastMessage.sender === 'assistant' || lastMessage.sender === 'human_agent') && actualMessages.length > 1) {
        let lastUserMessageIndex = -1;
        for (let i = actualMessages.length - 2; i >= 0; i--) {
            if (actualMessages[i].sender === 'user') {
                lastUserMessageIndex = i;
                break;
            }
        }

        if (lastUserMessageIndex !== -1) {
            const userMessageElement = messageElements[lastUserMessageIndex];
            if (userMessageElement) {
                messagesContainer.scrollTo({ top: userMessageElement.offsetTop, behavior: 'smooth' });
            } else {
                 scrollToEnd('smooth');
            }
        } else {
            const lastMessageElement = messageElements[messageElements.length - 1];
            if(lastMessageElement) {
              messagesContainer.scrollTo({ top: lastMessageElement.offsetTop, behavior: 'smooth' });
            }
        }
      } else {
        scrollToEnd('smooth');
      }
    });
  }

  function scrollToEnd(behavior = 'smooth') {
    tick().then(() => {
      if (messagesContainer) {
        messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior });
      }
    });
  }

  function handleScroll() {
    if (!messagesContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    if (atBottom) {
      showScrollButton = false;
    }
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

  $: if (messages.length > lastMessageCount) {
    if (!isDemo) {
        const lastItem = messages[messages.length - 1];
        if (lastItem && lastItem.type !== 'date') {
            const isUserAtBottom = messagesContainer 
                ? (messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight) < 150
                : true;

            if (isUserAtBottom) {
                smartScroll();
            } else {
                showScrollButton = true;
            }
        }
    }
    lastMessageCount = messages.length;
  }

  $: if (loadingState && loadingState.message) {
    if (!isDemo) {
      scrollToEnd('smooth');
    }
  }
</script>

<div id="chat-messages-wrapper">
  <div id="chat-messages" aria-live="polite" bind:this={messagesContainer}>
    {#each messages as message, i (message.type === 'date' ? message.date : message.sender + message.content.substring(0, 30) + Math.random())}
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
  scroll-behavior: smooth;
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

:global(.scroll-spacer) {
  height: 400px; /* A generous but fixed height */
  flex-shrink: 0;
}
</style>