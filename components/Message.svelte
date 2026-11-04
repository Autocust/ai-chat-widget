<script>
  import { getContext, createEventDispatcher } from 'svelte';
  import GateQuestion from './GateQuestion.svelte';
  import CtaButton from './CtaButton.svelte';
  import ProductCarousel from './ProductCarousel.svelte';
  import StructuredMessage from './StructuredMessage.svelte';

  const widgetConfig = getContext('widgetConfig');
  const dispatch = createEventDispatcher();
  export let message;
  // Options of the gate question, shown under its bubble while still unanswered
  export let gateOptions = null;

  $: showGateOptions = message.kind === 'gate_question' && !!gateOptions;
</script>

<div class="message-container {message.sender}-message {message.url || (message.links && message.links.length > 0) || showGateOptions ? 'has-cta' : ''}">
  <div class="message">
    {#if message.sender === 'user' && widgetConfig.userMessageIcon}
      <img src={widgetConfig.userMessageIcon} alt="User Icon" class="message-icon user-icon" />
    {/if}
    {#if message.sender === 'assistant' && widgetConfig.assistantMessageIcon}
      <img src={widgetConfig.assistantMessageIcon} alt="Assistant Icon" class="message-icon assistant-icon" />
    {/if}
    {#if message.sender === 'human_agent' && widgetConfig.humanAgentMessageIcon}
      <img src={widgetConfig.humanAgentMessageIcon} alt="Human Agent Icon" class="message-icon human-agent-icon" />
    {/if}
    {#if message.structured && !message.structured.attached}
      <div class="structured-wrapper">
        <StructuredMessage payload={message.structured} used={!!message.structuredUsed} chosen={message.structuredChoice} on:reply={(e) => dispatch('reply', { message, title: e.detail.title })} />
      </div>
    {:else}
      <div class="message-content">
        {@html message.content}
      </div>
    {/if}
  </div>
  {#if message.structured?.attached}
    <div class="attached-element">
      <StructuredMessage payload={message.structured} used={!!message.structuredUsed} chosen={message.structuredChoice} on:reply={(e) => dispatch('reply', { message, title: e.detail.title })} />
    </div>
  {/if}
  {#if showGateOptions}
    <GateQuestion question={message.content} options={gateOptions} on:select />
  {/if}
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

  .structured-wrapper {
    flex-grow: 1;
    min-width: 0;
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
    color: inherit;
    text-decoration: underline;
  }

  :global(.message-content ul), :global(.message-content ol) {
    padding-inline-start: 20px;
  }

  .attached-element {
    margin-top: 5px;
  }

  .message-links {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 5px;
  }
</style>