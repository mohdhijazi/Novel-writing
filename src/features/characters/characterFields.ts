import type { CharacterTextField } from './types';

export interface CharacterFieldDefinition {
  key: CharacterTextField;
  label: string;
  /** Rendered as a textarea rather than a single-line input. */
  multiline?: boolean;
}

export interface CharacterFieldGroup {
  title: string;
  fields: CharacterFieldDefinition[];
}

/** Drives the detail form, so adding a field is one entry here plus the type. */
export const CHARACTER_FIELD_GROUPS: CharacterFieldGroup[] = [
  {
    title: 'Identity',
    fields: [
      { key: 'firstName', label: 'First name' },
      { key: 'lastName', label: 'Last name' },
      { key: 'nicknames', label: 'Nicknames' },
      { key: 'age', label: 'Age' },
      { key: 'occupation', label: 'Occupation or role' },
      { key: 'socialClass', label: 'Social class or standing' },
    ],
  },
  {
    title: 'Physical',
    fields: [
      { key: 'distinguishingFeatures', label: 'Distinguishing features', multiline: true },
      { key: 'mannerisms', label: 'Mannerisms and tics', multiline: true },
    ],
  },
  {
    title: 'Psychology',
    fields: [
      { key: 'coreWant', label: 'Core want — what they consciously pursue', multiline: true },
      { key: 'coreNeed', label: 'Core need — what they actually need', multiline: true },
      { key: 'greatestFear', label: 'Greatest fear', multiline: true },
      { key: 'definingFlaw', label: 'Defining flaw or contradiction', multiline: true },
      {
        key: 'moralCode',
        label: "Moral code — what they won't do under pressure",
        multiline: true,
      },
    ],
  },
  {
    title: 'Voice',
    fields: [
      {
        key: 'speechPattern',
        label: 'Speech patterns — vocabulary, rhythm, what they avoid, their tell',
        multiline: true,
      },
    ],
  },
  {
    title: 'Background',
    fields: [
      { key: 'formativeEvents', label: 'Formative events', multiline: true },
      { key: 'pastRelationships', label: 'Past relationships that still echo', multiline: true },
    ],
  },
  {
    title: 'Relationships',
    fields: [
      { key: 'trustAndDistrust', label: 'Who they trust or distrust, and why', multiline: true },
      { key: 'powerDynamics', label: 'Power dynamics with other characters', multiline: true },
    ],
  },
  {
    title: 'Story function',
    fields: [
      { key: 'role', label: 'Role — protagonist, foil, catalyst, obstacle…' },
      { key: 'arcStart', label: 'Arc: starting point', multiline: true },
      { key: 'arcEnd', label: 'Arc: ending point', multiline: true },
      { key: 'arcChange', label: 'What forces the change', multiline: true },
    ],
  },
  {
    title: 'Secrets',
    fields: [
      { key: 'secretsFromOthers', label: 'What they hide from others', multiline: true },
      { key: 'secretsFromSelf', label: 'What they hide from themselves', multiline: true },
    ],
  },
];
