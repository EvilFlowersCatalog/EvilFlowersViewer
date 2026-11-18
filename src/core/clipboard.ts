/**
 * Puts text on the clipboard. Outside a secure context (plain http, some
 * embeds) the async Clipboard API is missing or refuses; a hidden textarea
 * and `execCommand('copy')` still work there. Resolves false when neither did.
 */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fall through to the legacy path
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  const previous = document.activeElement as HTMLElement | null;
  document.body.appendChild(field);
  field.select();
  let done = false;
  try {
    done = document.execCommand('copy');
  } catch {
    done = false;
  }
  field.remove();
  previous?.focus?.({ preventScroll: true });
  return done;
};
