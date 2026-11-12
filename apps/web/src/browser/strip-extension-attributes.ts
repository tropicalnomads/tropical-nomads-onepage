// McAfee WebAdvisor (fdprocessedid), ColorZilla, Grammarly, and the Cursor
// browser stamp attributes onto controls before hydration. next/script
// beforeInteractive yields a task before hydrate(), so the stamp lands in that
// gap. A MutationObserver also misses a stamp applied in the same turn React
// reads `element.attributes`. Hiding those names from the attribute list covers
// every element. The observer still removes them when it runs first.
const extensionAttributeNames = [
  'cz-shortcut-listen',
  'fdprocessedid',
  'data-new-gr-c-s-check-loaded',
  'data-gr-ext-installed',
  'data-cursor-ref',
] as const;

export const stripExtensionAttributes = `(function () {
  var names = ${JSON.stringify(extensionAttributeNames)};
  var blocked = Object.create(null);
  for (var i = 0; i !== names.length; i++) blocked[names[i]] = 1;
  function isBlocked(name) {
    return blocked[name] === 1;
  }
  function isIndex(prop) {
    return typeof prop === 'string' && prop !== '' && String(prop >>> 0) === prop;
  }
  function visibleCount(map) {
    var count = 0;
    for (var n = 0; n !== map.length; n++) {
      if (!isBlocked(map[n].name)) count++;
    }
    return count;
  }
  function visibleAt(map, index) {
    for (var n = 0, seen = 0; n !== map.length; n++) {
      if (isBlocked(map[n].name)) continue;
      if (seen === index) return map[n];
      seen++;
    }
    return undefined;
  }
  var descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'attributes');
  if (descriptor && typeof descriptor.get === 'function' && descriptor.configurable) {
    var nativeAttributes = descriptor.get;
    try {
      Object.defineProperty(Element.prototype, 'attributes', {
        configurable: true,
        enumerable: descriptor.enumerable,
        get: function () {
          var map = nativeAttributes.call(this);
          return new Proxy(map, {
            get: function (target, prop) {
              if (prop === 'length') return visibleCount(target);
              if (isIndex(prop)) return visibleAt(target, prop >>> 0);
              var value;
              try {
                value = target[prop];
              } catch (error) {
                return undefined;
              }
              if (prop === 'item' && typeof value === 'function') {
                return function (index) {
                  var attr = visibleAt(target, index >>> 0);
                  return attr === undefined ? null : attr;
                };
              }
              if (prop === 'getNamedItem' && typeof value === 'function') {
                return function (name) {
                  if (isBlocked(name)) return null;
                  return value.call(target, name);
                };
              }
              if (typeof value === 'function') {
                return function () { return value.apply(target, arguments); };
              }
              return value;
            }
          });
        }
      });
    } catch (error) {}
  }
  var selector = '[' + names.join('],[') + ']';
  function strip(node) {
    if (!node || node.nodeType !== 1) return;
    for (var n = 0; n !== names.length; n++) {
      if (node.hasAttribute(names[n])) node.removeAttribute(names[n]);
    }
  }
  function stripTree(root) {
    strip(root);
    if (!root.querySelectorAll) return;
    var nodes = root.querySelectorAll(selector);
    for (var n = 0; n !== nodes.length; n++) strip(nodes[n]);
  }
  var root = document.documentElement;
  var observer = new MutationObserver(function (records) {
    for (var n = 0; n !== records.length; n++) {
      var record = records[n];
      if (record.type === 'attributes') strip(record.target);
      var added = record.addedNodes;
      for (var j = 0; added && j !== added.length; j++) {
        if (added[j].nodeType === 1) stripTree(added[j]);
      }
    }
  });
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: names
  });
  stripTree(root);
  window.addEventListener('load', function () {
    stripTree(root);
    observer.disconnect();
  }, { once: true });
})();`;
