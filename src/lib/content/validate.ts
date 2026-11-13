import { SECTIONS, STATUSES, TYPES, type ContentItem } from '../model';

export interface ItemInput {
  title?: unknown; status?: unknown; type?: unknown; authors?: unknown;
  deadline?: unknown; archived?: unknown; body?: unknown; cover?: unknown; caption?: unknown; section?: unknown;
}

export class ValidationError extends Error {}

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return `${value}`;
  return '';
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], message: string): T {
  if (!allowed.includes(value as T)) throw new ValidationError(message);
  return value as T;
}

function applyTitle(out: Partial<ContentItem>, input: ItemInput) {
  if (input.title === undefined) return;
  const t = asString(input.title).trim();
  if (!t || t.length > 160) throw new ValidationError('Title is required (max 160 characters).');
  out.title = t;
}

function applyStatus(out: Partial<ContentItem>, input: ItemInput) {
  if (input.status === undefined) return;
  out.status = oneOf(input.status, STATUSES, 'Invalid status.');
}

function applyType(out: Partial<ContentItem>, input: ItemInput) {
  if (input.type === undefined) return;
  out.type = oneOf(input.type, TYPES, 'Invalid type.');
}

function applyDeadline(out: Partial<ContentItem>, input: ItemInput) {
  if (input.deadline === undefined) return;
  const deadline = asString(input.deadline);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) throw new ValidationError('Deadline must be a date.');
  out.deadline = deadline;
}

function applyAuthors(out: Partial<ContentItem>, input: ItemInput, validUsers: string[]) {
  if (input.authors === undefined) return;
  const a = [...new Set([input.authors].flat().map(String))].filter((id) => validUsers.includes(id));
  if (!a.length) throw new ValidationError('Pick at least one author.');
  out.authors = a;
}

function applyCover(out: Partial<ContentItem>, input: ItemInput) {
  if (input.cover === undefined) return;
  const c = asString(input.cover).trim();
  if (c && !/^(https?:\/\/|\/(?!\/))/.test(c)) throw new ValidationError('Cover must be an http(s) URL or a /path.');
  out.cover = c || undefined;
}

function applyCaption(out: Partial<ContentItem>, input: ItemInput) {
  if (input.caption === undefined) return;
  const v = asString(input.caption).replace(/\s+/g, ' ').trim();
  if (v.length > 300) throw new ValidationError('Caption is too long (max 300 characters).');
  out.caption = v || undefined;
}

function applySection(out: Partial<ContentItem>, input: ItemInput) {
  if (input.section === undefined) return;
  const v = asString(input.section).trim();
  if (v && !(SECTIONS as readonly string[]).includes(v)) throw new ValidationError('Invalid section.');
  out.section = v || undefined;
}

function applyArchived(out: Partial<ContentItem>, input: ItemInput) {
  if (input.archived === undefined) return;
  out.archived = input.archived === true || input.archived === 'true';
}

function applyBody(out: Partial<ContentItem>, input: ItemInput) {
  if (input.body === undefined) return;
  out.body = asString(input.body);
}

/** Validate a partial patch; throws ValidationError on bad input. */
export function clean(input: ItemInput, validUsers: string[]): Partial<ContentItem> {
  const out: Partial<ContentItem> = {};
  applyTitle(out, input);
  applyStatus(out, input);
  applyType(out, input);
  applyDeadline(out, input);
  applyAuthors(out, input, validUsers);
  applyCover(out, input);
  applyCaption(out, input);
  applySection(out, input);
  applyArchived(out, input);
  applyBody(out, input);
  return out;
}
