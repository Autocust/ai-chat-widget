<script>
  import CtaButton from './CtaButton.svelte';
  import { widgetConfig } from '../utils/stores.js';
  import ProductCarousel from './ProductCarousel.svelte';

  export let message;
</script>

<div class="message-container {message.sender}-message {message.url || (message.links && message.links.length > 0) ? 'has-cta' : ''}">
  <div class="message">
    {#if message.sender === 'user' && $widgetConfig.userMessageIcon}
      <img src={$widgetConfig.userMessageIcon} alt="User Icon" class="message-icon user-icon" />
    {/if}
    {#if message.sender === 'assistant' && $widgetConfig.assistantMessageIcon}
      <img src={$widgetConfig.assistantMessageIcon} alt="Assistant Icon" class="message-icon assistant-icon" />
    {/if}
    {#if message.sender === 'human_agent' && $widgetConfig.humanAgentMessageIcon}
      <img src={$widgetConfig.humanAgentMessageIcon} alt="Human Agent Icon" class="message-icon human-agent-icon" />
    {/if}
    <div class="message-content">
      {@html message.content}
    </div>
  </div>
  {#if message.url}
    <CtaButton url={message.url} ctaText={message.ctaText} />
  {/if}
  {#if message.links && message.links.length > 0}
    <div class="message-links">
      {#each message.links as link}
        <CtaButton url={link.url} ctaText={link.text} />
      {/each}
    </div>
  {/if}
  {#if message.products && message.products.length > 0}
    <ProductCarousel products={message.products} />
  {/if}
</div>

<style>
  .message-container {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
    min-width: 50%;
  }

  .message-container.has-cta {
    max-width: 100%; /* Allow full width for messages with CTA buttons */
  }

  
  .user-message {
    margin-left: auto;
  }
  .assistant-message,
  .human_agent-message {
    margin-right: auto;
  }
  .system-message {
    margin-left: auto;
    margin-right: auto;
    text-align: center;
    font-style: italic;
    color: #888;
  }
  .message {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .message-icon {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }
  .message-content {
    flex-grow: 1;
    word-wrap: break-word;
    padding: 5px 10px;
    border-radius: 5px;
  }
  .user-message .message-content {
    background-color: var(--user-msg-bg);
    color: var(--user-msg-text);
  }
  .assistant-message .message-content {
    background-color: var(--assistant-msg-bg);
    color: var(--assistant-msg-text);
  }
  .human_agent-message .message-content {
    background-color: var(--human-agent-msg-bg);
    color: var(--human-agent-msg-text);
  }
  .message-content :global(a) {
    color: var(--link-color);
  }
  :global(.message-content ul), :global(.message-content ol) {
    padding-inline-start: 20px;
  }
  
  .message-links {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 5px;
  }
</style>