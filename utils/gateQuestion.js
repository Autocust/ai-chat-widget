const OPTION_ID_PATTERN = /^[a-z0-9_-]{1,32}$/;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Validates the gate question config (an object or a JSON string).
 * Returns { question, options } or null when it is missing, disabled or
 * malformed: in that case the widget behaves as if the feature did not exist.
 */
export function normalizeGateQuestion(raw) {
  let gate = raw;
  if (typeof gate === 'string') {
    try {
      gate = JSON.parse(gate);
    } catch (e) {
      return null;
    }
  }
  if (!isPlainObject(gate) || gate.enabled !== true || !isText(gate.question)) return null;
  if (!Array.isArray(gate.options)) return null;
  if (gate.options.length < MIN_OPTIONS || gate.options.length > MAX_OPTIONS) return null;

  const seenIds = new Set();
  const options = [];
  for (const option of gate.options) {
    if (!isPlainObject(option)) return null;
    if (typeof option.id !== 'string' || !OPTION_ID_PATTERN.test(option.id)) return null;
    if (seenIds.has(option.id)) return null;
    if (!isText(option.label) || !isText(option.reply)) return null;
    seenIds.add(option.id);
    const normalized = { id: option.id, label: option.label, reply: option.reply };
    if (isText(option.context)) normalized.context = option.context;
    options.push(normalized);
  }
  return { question: gate.question, options };
}

/** Validates a choice read back from storage. */
export function normalizeGateChoice(raw) {
  if (!isPlainObject(raw)) return null;
  if (!isText(raw.id) || !isText(raw.label) || !isText(raw.reply) || !isText(raw.question)) return null;
  const choice = { id: raw.id, label: raw.label, reply: raw.reply, question: raw.question };
  if (isText(raw.context)) choice.context = raw.context;
  return choice;
}

function contextToObject(context) {
  if (isPlainObject(context)) return { ...context };
  if (typeof context === 'string') {
    if (!context.trim()) return {};
    try {
      const parsed = JSON.parse(context);
      if (isPlainObject(parsed)) return parsed;
    } catch (e) {
      // plain text context: handled below
    }
    return { page_context: context };
  }
  if (context === null || context === undefined) return {};
  return { page_context: context };
}

/**
 * The API replaces the whole context on every `context` event, so the gate
 * choice is merged into the existing widget context instead of replacing it.
 */
export function mergeGateContext(context, choice) {
  const gate = {
    question: choice.question,
    answer: choice.label,
    reply_shown: choice.reply,
  };
  if (choice.context) gate.context = choice.context;
  return { ...contextToObject(context), gate_question: gate };
}
