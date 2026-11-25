/** Sets a native value and fires React's onChange, controlled or not. */
export function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  Object.getOwnPropertyDescriptor(proto.prototype, 'value')?.set?.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
}
