<script>
  export let date;

  function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat(navigator.language, options).format(new Date(date));
  }
</script>

<div class="date-separator">
  {formatDate(date)}
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
