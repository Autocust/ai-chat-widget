<script>
  export let date; // Date | number | string

  function toDate(input) {
    if (input instanceof Date) return input;

    if (typeof input === 'number') {
      // se è in secondi (es. 1696761600), converti in ms
      const ms = input < 1e12 ? input * 1000 : input;
      return new Date(ms);
    }

    if (typeof input === 'string') {
      const s = input.trim();
      if (!s) return new Date(NaN);

      // ISO puro o ISO-like -> va bene lasciarlo a Date
      if (/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(s)) {
        return new Date(s);
      }

      // dd/mm/yyyy (es. 08/10/2025)
      const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);

      // mm-dd-yyyy (es. 10-08-2025)
      const mdy = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (mdy) return new Date(+mdy[3], +mdy[1] - 1, +mdy[2]);

      // fallback: lascia che Date provi a parsare
      return new Date(s);
    }

    return new Date(NaN);
  }

  const getLocale = () =>
    (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';

  const formatter = new Intl.DateTimeFormat(getLocale(), { year: 'numeric', month: 'long', day: 'numeric' });

  $: parsed = toDate(date);
  $: isValid = !Number.isNaN(parsed.getTime());
  $: formatted = isValid ? formatter.format(parsed) : '';
</script>

<div class="date-separator">
  {#if isValid}{formatted}{/if}
</div>

<style>
  .date-separator {
    text-align: center;
    margin: 10px 0;
    font-size: 0.8em;
    color: #888;
  }
  :global(#chat-messages .date-separator:first-child) { margin-top: 0; }
</style>
