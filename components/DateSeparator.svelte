<script>
  export let date;

  function formatDate(date) {
    if (!date) return ''; // guard if date is undefined/null

    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      console.warn('Invalid date passed to DateSeparator:', date);
      return ''; // avoid crashing
    }

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat(navigator.language, options).format(parsed);
  }
</script>

<div class="date-separator">
  {#if formatDate(date)}
    {formatDate(date)}
  {/if}
</div>

<style>
  .date-separator {
    text-align: center;
    margin: 10px 0;
    font-size: 0.8em;
    color: #888;
  }

  :global(#chat-messages .date-separator:first-child) {
    margin-top: 0;
  }
</style>
