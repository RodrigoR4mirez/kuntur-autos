/** "yes" → true, "no" → false, cualquier otra cosa ("No sé") → null (no informado). */
export function parseTriState(value: FormDataEntryValue | null): boolean | null {
  return value === 'yes' ? true : value === 'no' ? false : null;
}
