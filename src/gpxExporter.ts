export const GPX_NS = 'http://www.topografix.com/GPX/1/1';

export function createElement(
  parent: Element,
  name: string,
  text: string | undefined | null,
  attributes: { [key: string]: string } = {},
) {
  const elem = document.createElementNS(GPX_NS, name);
  if (text !== undefined) {
    elem.textContent = text;
  }

  Object.keys(attributes).forEach(key =>
    addAttribute(elem, key, attributes[key]),
  );

  parent.appendChild(elem);
  return elem;
}

export function addAttribute(elem: Element, name: string, value: string) {
  const attr = document.createAttribute(name);
  attr.value = value;
  elem.setAttributeNode(attr);
}
