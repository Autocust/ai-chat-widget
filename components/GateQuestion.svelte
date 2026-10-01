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
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 10px 10px;
  background-color: var(--messages-bg);
  flex-shrink: 0;
  max-height: 35%;
  overflow-y: auto;
}

.gate-option-btn {
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid var(--disclaimer-text);
  background-color: transparent;
  color: var(--primary-text-color);
  cursor: pointer;
  font-size: 14px;
  text-align: center;
  transition: background-color 0.2s;
}

.gate-option-btn:hover {
  background-color: var(--container-bg);
}
</style>
