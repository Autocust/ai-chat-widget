<script>
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  export let question = '';
  export let options = [];

  const dispatch = createEventDispatcher();
</script>

<div class="gate-options" role="group" aria-label={question} transition:fade={{ duration: 300 }}>
  {#each options as option (option.id)}
    <button type="button" class="gate-option-btn" on:click={() => dispatch('select', option)}>
      {option.label}
    </button>
  {/each}
</div>

<style>
.gate-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 10px 10px;
  background-color: var(--messages-bg);
  flex-shrink: 0;
  max-height: 35%;
  overflow-y: auto;
}

/* Same look as the CTA buttons shown inside messages (see CtaButton.svelte) */
.gate-option-btn {
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
  transition: background-color 0.3s, color 0.3s;
}

.gate-option-btn:hover {
  background-color: var(--cta-btn-hover-bg, var(--cta-hover-bg));
  color: var(--cta-btn-hover-text, var(--cta-hover-text));
}
</style>
