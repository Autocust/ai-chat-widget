<script>
  import { createEventDispatcher } from 'svelte';

  // Normalized payload (see utils/structuredMessage.js)
  export let payload;
  // True once the user has replied: reply buttons and list rows are greyed out
  export let used = false;

  const dispatch = createEventDispatcher();
  let listOpen = false;

  function reply(title) {
    if (used) return;
    listOpen = false;
    dispatch('reply', { title });
  }
</script>

<div class="structured">
  {#if payload.type === 'image'}
    <figure class="bubble image-bubble">
      <img src={payload.url} alt={payload.caption || ''} loading="lazy" />
      {#if payload.caption}<figcaption>{payload.caption}</figcaption>{/if}
    </figure>
  {:else}
    {#if !payload.attached || payload.header || payload.footer}
      <div class="bubble">
        {#if payload.header}<div class="header">{payload.header}</div>{/if}
        {#if payload.body}<div class="body">{payload.body}</div>{/if}
        {#if payload.footer}<div class="footer">{payload.footer}</div>{/if}
      </div>
    {/if}

    {#if payload.type === 'cta_url'}
      <a class="action-btn" href={payload.url} target="_blank" rel="noopener noreferrer">{payload.display_text}</a>
    {:else if payload.type === 'button'}
      <div class="actions" role="group">
        {#each payload.buttons as button}
          <button type="button" class="action-btn" disabled={used} on:click={() => reply(button.title)}>{button.title}</button>
        {/each}
      </div>
    {:else if payload.type === 'list'}
      <button type="button" class="action-btn" disabled={used} aria-expanded={listOpen} on:click={() => (listOpen = !listOpen)}>
        {payload.button_text}
      </button>
      {#if listOpen && !used}
        <div class="list">
          {#each payload.sections as section}
            {#if section.title}<div class="section-title">{section.title}</div>{/if}
            {#each section.rows as row}
              <button type="button" class="row" on:click={() => reply(row.title)}>
                <span class="row-title">{row.title}</span>
                {#if row.description}<span class="row-description">{row.description}</span>{/if}
              </button>
            {/each}
          {/each}
        </div>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .structured { display: flex; flex-direction: column; gap: 5px; }

  .bubble {
    padding: 5px 10px;
    border-radius: 5px;
    background-color: var(--assistant-msg-bg);
    color: var(--assistant-msg-text);
    word-wrap: break-word;
    white-space: pre-line;
  }
  .header { font-weight: bold; }
  .footer { font-size: 12px; opacity: 0.65; margin-top: 4px; }

  .image-bubble { margin: 0; padding: 5px; }
  .image-bubble img { display: block; max-width: 100%; border-radius: 4px; }
  .image-bubble figcaption { margin-top: 4px; font-size: 13px; }

  .actions { display: flex; flex-direction: column; gap: 5px; }

  /* Same look as the CTA buttons shown inside messages (see CtaButton.svelte) */
  .action-btn {
    display: block;
    width: 100%;
    box-sizing: border-box;
    padding: 8px 12px;
    border-radius: 20px;
    border: none;
    background-color: var(--cta-btn-bg);
    color: var(--cta-btn-text);
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    text-align: center;
    text-decoration: none;
    transition: background-color 0.3s, color 0.3s;
  }
  .action-btn:hover:not(:disabled) {
    background-color: var(--cta-btn-hover-bg, var(--cta-hover-bg));
    color: var(--cta-btn-hover-text, var(--cta-hover-text));
  }
  .action-btn:disabled { opacity: 0.45; cursor: default; }

  .list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px;
    border-radius: 8px;
    background-color: var(--assistant-msg-bg);
    color: var(--assistant-msg-text);
  }
  .section-title { font-size: 12px; font-weight: bold; opacity: 0.65; padding: 6px 8px 2px; }
  .row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 8px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
  }
  .row:hover { background-color: rgba(128, 128, 128, 0.18); }
  .row-description { font-size: 12px; opacity: 0.65; }
</style>
