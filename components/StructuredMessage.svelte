<script>
  import { createEventDispatcher } from 'svelte';

  // Normalized payload (see utils/structuredMessage.js)
  export let payload;
  // True once the user has replied: reply buttons and list rows are disabled
  export let used = false;
  // Title of the button or row the user picked, highlighted once used
  export let chosen = null;

  const dispatch = createEventDispatcher();
  let listOpen = false;

  // One section: its title would only repeat the card title, so it is shown when there is no header
  $: showSectionTitles = payload.sections?.length > 1 || !payload.header;

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
    {#if !payload.attached}
      <div class="bubble">
        {#if payload.header}<div class="header">{payload.header}</div>{/if}
        {#if payload.body}<div class="body">{payload.body}</div>{/if}
        {#if payload.footer}<div class="footer">{payload.footer}</div>{/if}
      </div>
    {:else if payload.header && payload.type !== 'list'}
      <div class="mini-label">{payload.header}</div>
    {/if}

    {#if payload.type === 'cta_url'}
      <a class="action-btn" href={payload.url} target="_blank" rel="noopener noreferrer">{payload.display_text}</a>
    {:else if payload.type === 'button'}
      <div class="actions" role="group">
        {#each payload.buttons as button}
          <button
            type="button"
            class="action-btn"
            class:chosen={used && chosen === button.title}
            class:dimmed={used && chosen !== button.title}
            disabled={used}
            on:click={() => reply(button.title)}
          >{button.title}</button>
        {/each}
      </div>
    {:else if payload.type === 'list'}
      <!-- Attached lists are shown open under the reply: the toggle is only needed on WhatsApp -->
      {#if !payload.attached}
        <button type="button" class="action-btn" disabled={used} aria-expanded={listOpen} on:click={() => (listOpen = !listOpen)}>
          {payload.button_text}
        </button>
      {/if}
      {#if payload.attached || (listOpen && !used)}
        <div class="list" role="group" aria-label={payload.header || payload.button_text}>
          {#if payload.attached && payload.header}<div class="list-title">{payload.header}</div>{/if}
          {#each payload.sections as section}
            {#if section.title && showSectionTitles}<div class="section-title">{section.title}</div>{/if}
            {#each section.rows as row}
              <button
                type="button"
                class="row"
                class:chosen={used && chosen === row.title}
                class:dimmed={used && chosen !== row.title}
                disabled={used}
                on:click={() => reply(row.title)}
              >
                <span class="row-text">
                  <span class="row-title">{row.title}</span>
                  {#if row.description}<span class="row-description">{row.description}</span>{/if}
                </span>
                <span class="row-mark" aria-hidden="true">{used && chosen === row.title ? '✓' : '›'}</span>
              </button>
            {/each}
          {/each}
          {#if payload.attached && payload.footer}<div class="list-footer">{payload.footer}</div>{/if}
        </div>
      {/if}
    {/if}
    {#if payload.attached && payload.footer && payload.type !== 'list'}
      <div class="mini-label">{payload.footer}</div>
    {/if}
  {/if}
</div>

<style>
  /* All sizes are relative to the message text size (em), never hardcoded */
  .structured { display: flex; flex-direction: column; gap: 0.35em; }

  .bubble {
    padding: 5px 10px;
    border-radius: 5px;
    background-color: var(--assistant-msg-bg);
    color: var(--assistant-msg-text);
    word-wrap: break-word;
    white-space: pre-line;
  }
  .header { font-weight: bold; }
  .footer { font-size: 0.8em; opacity: 0.65; margin-top: 0.3em; }

  .image-bubble { margin: 0; padding: 5px; }
  .image-bubble img { display: block; max-width: 100%; border-radius: 4px; }
  .image-bubble figcaption { margin-top: 0.3em; font-size: 0.9em; }

  .actions { display: flex; flex-direction: column; gap: 0.35em; }

  /* Same look as the CTA buttons shown inside messages (see CtaButton.svelte) */
  .action-btn {
    display: block;
    width: 100%;
    box-sizing: border-box;
    padding: 0.55em 0.85em;
    border-radius: 1.4em;
    border: none;
    background-color: var(--cta-btn-bg);
    color: var(--cta-btn-text);
    cursor: pointer;
    font-family: inherit;
    font-size: 1em;
    text-align: center;
    text-decoration: none;
    transition: background-color 0.3s, color 0.3s, opacity 0.3s;
  }
  .action-btn:hover:not(:disabled) {
    background-color: var(--cta-btn-hover-bg, var(--cta-hover-bg));
    color: var(--cta-btn-hover-text, var(--cta-hover-text));
  }
  .action-btn:disabled { cursor: default; }
  .action-btn.dimmed { opacity: 0.55; }

  .list {
    display: flex;
    flex-direction: column;
    gap: 0.35em;
    padding: 0.5em;
    border-radius: 0.6em;
    background-color: var(--assistant-msg-bg);
    color: var(--assistant-msg-text);
  }
  .list-title { font-weight: bold; padding: 0.1em 0.25em 0.15em; }
  .section-title { font-size: 0.8em; font-weight: bold; opacity: 0.65; padding: 0.35em 0.25em 0; }
  .list-footer, .mini-label { font-size: 0.8em; opacity: 0.65; padding: 0 0.25em; }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6em;
    min-height: 2.75em;
    box-sizing: border-box;
    padding: 0.5em 0.75em;
    border: 1px solid rgba(128, 128, 128, 0.35);
    border-radius: 0.5em;
    background-color: color-mix(in srgb, var(--assistant-msg-text) 4%, transparent);
    color: inherit;
    font-family: inherit;
    font-size: 1em;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s, opacity 0.2s;
  }
  .row-text { display: flex; flex-direction: column; gap: 0.1em; min-width: 0; }
  .row-title { font-weight: 600; }
  .row-description { font-size: 0.85em; opacity: 0.7; }
  .row-mark { flex-shrink: 0; font-size: 1.3em; line-height: 1; opacity: 0.5; }

  .row:hover:not(:disabled) { border-color: var(--cta-btn-bg); background-color: color-mix(in srgb, var(--cta-btn-bg) 10%, transparent); }
  .row:focus-visible, .action-btn:focus-visible { outline: 2px solid var(--cta-btn-bg); outline-offset: 2px; }
  .row:disabled { cursor: default; }
  .row.dimmed { opacity: 0.55; }
  .row.chosen { border-color: var(--cta-btn-bg); border-width: 2px; opacity: 1; }
  .row.chosen .row-mark { opacity: 1; color: var(--cta-btn-bg); }
  .action-btn.chosen { opacity: 1; box-shadow: 0 0 0 2px var(--assistant-msg-bg), 0 0 0 4px var(--cta-btn-bg); }
</style>
