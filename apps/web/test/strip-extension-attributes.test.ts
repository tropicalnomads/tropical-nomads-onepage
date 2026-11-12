import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { stripExtensionAttributes } from '../src/browser/strip-extension-attributes.ts';

interface FakeAttr {
  name: string;
  value: string;
}

interface FakeMap {
  length: number;
  item: (index: number) => FakeAttr | null;
  getNamedItem: (name: string) => FakeAttr | null;
  [index: number]: FakeAttr;
}

interface FakeElement {
  nodeType: number;
  _items: FakeAttr[];
  _map: FakeMap;
  setAttribute: (name: string, value: string) => void;
  getAttribute: (name: string) => string | null;
  hasAttribute: (name: string) => boolean;
  removeAttribute: (name: string) => void;
  removeAttributeNode: (attr: FakeAttr) => FakeAttr;
  querySelectorAll: (selector: string) => FakeElement[];
  attributes: FakeMap;
}

function syncMap(element: FakeElement): void {
  const map = element._map;
  for (const key of Object.keys(map)) {
    if (/^(0|[1-9]\d*)$/.test(key)) {
      delete map[Number(key)];
    }
  }
  element._items.forEach((attr, index) => {
    map[index] = attr;
  });
}

function createElement(): FakeElement {
  const element = {
    nodeType: 1,
    _items: [],
  } as unknown as FakeElement;
  const map = {
    get length() {
      return element._items.length;
    },
    item(index: number) {
      return element._items[index] ?? null;
    },
    getNamedItem(name: string) {
      return element._items.find((attr) => attr.name === name) ?? null;
    },
  } as FakeMap;
  element._map = map;
  element.setAttribute = (name, value) => {
    const existing = element._items.find((attr) => attr.name === name);
    if (existing) {
      existing.value = value;
    } else {
      element._items.push({ name, value });
    }
    syncMap(element);
  };
  element.getAttribute = (name) => element._items.find((attr) => attr.name === name)?.value ?? null;
  element.hasAttribute = (name) => element._items.some((attr) => attr.name === name);
  element.removeAttribute = (name) => {
    element._items = element._items.filter((attr) => attr.name !== name);
    syncMap(element);
  };
  element.removeAttributeNode = (attr) => {
    if (!element._items.includes(attr)) {
      throw new Error('NotFoundError');
    }
    element._items = element._items.filter((item) => item !== attr);
    syncMap(element);
    return attr;
  };
  element.querySelectorAll = () => [];
  return element;
}

class FakeElementHost {
  nodeType = 1;
  _items: FakeAttr[] = [];
  _map!: FakeMap;
  declare readonly attributes: FakeMap;

  constructor() {
    const created = createElement();
    this._items = created._items;
    this._map = created._map;
    this.setAttribute = created.setAttribute;
    this.getAttribute = created.getAttribute;
    this.hasAttribute = created.hasAttribute;
    this.removeAttribute = created.removeAttribute;
    this.removeAttributeNode = created.removeAttributeNode;
    this.querySelectorAll = created.querySelectorAll;
  }

  setAttribute: FakeElement['setAttribute'];
  getAttribute: FakeElement['getAttribute'];
  hasAttribute: FakeElement['hasAttribute'];
  removeAttribute: FakeElement['removeAttribute'];
  removeAttributeNode: FakeElement['removeAttributeNode'];
  querySelectorAll: FakeElement['querySelectorAll'];
}

describe('extension attribute hydration guard', () => {
  const previous = {
    Element: globalThis.Element,
    document: globalThis.document,
    MutationObserver: globalThis.MutationObserver,
    window: globalThis.window,
  };

  before(() => {
    Object.defineProperty(FakeElementHost.prototype, 'attributes', {
      configurable: true,
      enumerable: true,
      get() {
        return (this as FakeElementHost)._map;
      },
    });
    const root = new FakeElementHost();
    root.setAttribute('fdprocessedid', 'server-stamp');
    root.setAttribute('lang', 'en');
    Object.assign(globalThis, {
      Element: FakeElementHost,
      document: { documentElement: root },
      MutationObserver: class {
        observe(): void {}
        disconnect(): void {}
      },
      window: { addEventListener(): void {} },
    });
    eval(stripExtensionAttributes);
  });

  after(() => {
    Object.assign(globalThis, previous);
  });

  it('drops extension stamps from the attribute list React hydrates', () => {
    const button = new FakeElementHost();
    button.setAttribute('type', 'button');
    button.setAttribute('fdprocessedid', 'l967zq');
    button.setAttribute('data-cursor-ref', 'e11');
    button.setAttribute('class', 'inline-flex');
    button.setAttribute('cz-shortcut-listen', 'true');

    const seen: string[] = [];
    const attributes = button.attributes;
    for (let index = 0; index < attributes.length; index += 1) {
      const attr = attributes[index];
      assert.ok(attr);
      seen.push(attr.name);
    }

    assert.deepEqual(seen, ['type', 'class']);
    assert.equal(button.getAttribute('fdprocessedid'), 'l967zq');
    assert.equal(button.attributes.getNamedItem('fdprocessedid'), null);
    assert.equal(button.attributes.getNamedItem('class')?.value, 'inline-flex');
    assert.equal(button.attributes.item(0)?.name, 'type');
    assert.equal(button.attributes.item(1)?.name, 'class');
    assert.equal(button.attributes.item(2), null);
  });

  it('clears real attributes without looping on a hidden extension stamp', () => {
    const button = new FakeElementHost();
    button.setAttribute('id', 'google');
    button.setAttribute('fdprocessedid', 'z8ymss');
    button.setAttribute('disabled', 'disabled');

    let removed = 0;
    for (let attributes = button.attributes; attributes.length; ) {
      button.removeAttributeNode(attributes[0] as FakeAttr);
      removed += 1;
      assert.ok(removed < 10);
    }

    assert.equal(removed, 2);
    assert.equal(button.getAttribute('id'), null);
    assert.equal(button.getAttribute('disabled'), null);
    assert.equal(button.getAttribute('fdprocessedid'), 'z8ymss');
    assert.equal(button.attributes.length, 0);
  });

  it('strips stamps already on the document element during parse', () => {
    const root = globalThis.document.documentElement as unknown as FakeElementHost;
    assert.equal(root.getAttribute('fdprocessedid'), null);
    assert.equal(root.getAttribute('lang'), 'en');
  });

  it('is the script rendered by the root layout', () => {
    const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
    assert.match(layout, /<script dangerouslySetInnerHTML=\{\{ __html: stripExtensionAttributes \}\} \/>/);
  });
});
