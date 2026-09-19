import { CHARACTER_FIELD_GROUPS } from '@/features/characters/characterFields';

import { IMPORT_FORMAT, IMPORT_VERSION } from './importSchema';

/** The character keys, listed for the prompt straight from the form's own fields. */
function characterKeyList(): string {
  return CHARACTER_FIELD_GROUPS.flatMap((group) =>
    group.fields.map((field) => `    "${field.key}": ""${field.key === 'role' ? '' : ''}`),
  ).join(',\n');
}

/**
 * The instructions a user pastes into whatever AI has read their story, so it
 * returns a file this app can import. Built from the real field list, so it
 * cannot drift from the app.
 */
export function buildImportPrompt(): string {
  return `You are helping me turn a story into structured world-building notes.

Read the document I have given you and produce ONE JSON file describing its world.

Rules:
- Reply with the JSON only — no explanation, no markdown fences, nothing else.
- Use exactly the keys shown below. Leave a field as "" when the document does not say.
- Prefer what the document actually states. Where you infer something, keep it plausible and brief.
- Years are whole numbers and may be negative for dates before the calendar's year zero.
- "month" on an event must match one of the calendar month names in this same file, or be "".
- "day" is a number within that month, or 0 if unknown.
- A location's "connections" lists the names of other locations in this same file.
- Ideas are single sentences: loose threads, questions, things worth exploring later.
- Include every character, location and event worth remembering. Do not include the prose itself.

{
  "format": "${IMPORT_FORMAT}",
  "version": ${String(IMPORT_VERSION)},
  "world": { "name": "Name of the world" },
  "calendar": {
    "name": "Name of the calendar, or \\"\\"",
    "months": [ { "name": "Month name", "days": 30 } ],
    "weekdays": [ "First day of the week", "Second day" ]
  },
  "characters": [
  {
${characterKeyList()}
  }
  ],
  "locations": [
    { "name": "Place name", "type": "city, forest, tavern…", "area": "The wider region", "connections": ["Another place name"] }
  ],
  "events": [
    { "name": "What happened", "details": "A sentence or two", "year": 0, "month": "", "day": 0 }
  ],
  "ideas": [ "A single sentence worth following up." ]
}

If the document has no calendar of its own, use "calendar": null and leave every event's "month" as "".`;
}
