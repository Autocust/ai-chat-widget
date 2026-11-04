// Interactive ("structured") assistant messages sent by the API through the
// `structured_message` socket event. Payload types: cta_url, button, list, image.

const isText = (v) => typeof v === 'string' && v.trim() !== '';

function isSafeUrl(value) {
  if (!isText(value)) return false;
  try {
    const { protocol } = new URL(value, 'https://placeholder.invalid');
    return protocol === 'http:' || protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function optionalText(value) {
  return isText(value) ? value : undefined;
}

function normalizeRow(row) {
  if (!row || !isText(row.title)) return null;
  return { id: row.id, title: row.title, description: optionalText(row.description) };
}

// Returns a clean payload, or null for unknown or malformed ones (rendered as nothing).
export function normalizeStructuredPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  // Attached elements ride under the reply bubble: the streamed reply is their text
  const attached = payload.attached === true;
  const common = { type: payload.type, attached, header: optionalText(payload.header), footer: optionalText(payload.footer) };
  const hasBody = attached || isText(payload.body);

  switch (payload.type) {
    case 'cta_url':
      if (!hasBody || !isText(payload.display_text) || !isSafeUrl(payload.url)) return null;
      return { ...common, body: optionalText(payload.body), display_text: payload.display_text, url: payload.url };

    case 'button': {
      const buttons = (Array.isArray(payload.buttons) ? payload.buttons : [])
        .filter((b) => b && isText(b.title))
        .slice(0, 3)
        .map((b) => ({ id: b.id, title: b.title }));
      if (!hasBody || buttons.length === 0) return null;
      return { ...common, body: optionalText(payload.body), buttons };
    }

    case 'list': {
      const sections = (Array.isArray(payload.sections) ? payload.sections : [])
        .map((s) => ({
          title: optionalText(s?.title),
          rows: (Array.isArray(s?.rows) ? s.rows : []).map(normalizeRow).filter(Boolean)
        }))
        .filter((s) => s.rows.length > 0);
      if (!hasBody || !isText(payload.button_text) || sections.length === 0) return null;
      return { ...common, body: optionalText(payload.body), button_text: payload.button_text, sections };
    }

    case 'image':
      if (!isSafeUrl(payload.url)) return null;
      return { type: 'image', attached, url: payload.url, caption: optionalText(payload.caption) };

    default:
      return null;
  }
}
