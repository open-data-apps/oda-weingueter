const fs = require("fs");
const path = require("path");
const vm = require("vm");

class RuntimeElement {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.listeners = {};
  }
  closest(selector) {
    return this.matches && this.matches(selector) ? this : null;
  }
  addEventListener(type, handler) {
    (this.listeners[type] ||= []).push(handler);
  }
  removeEventListener(type, handler) {
    this.listeners[type] = (this.listeners[type] || []).filter((candidate) => candidate !== handler);
  }
}

function makeStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    clear() { values.clear(); },
  };
}

function makeElement() {
  const classes = new Set();
  return {
    innerHTML: "",
    textContent: "",
    value: "",
    disabled: false,
    hidden: false,
    style: {},
    classList: {
      add(value) { classes.add(value); },
      remove(value) { classes.delete(value); },
      toggle(value, force) {
        if (force === undefined ? !classes.has(value) : force) classes.add(value);
        else classes.delete(value);
      },
      contains(value) { return classes.has(value); },
    },
    listeners: {},
    addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); },
    removeEventListener(type, handler) {
      this.listeners[type] = (this.listeners[type] || []).filter((candidate) => candidate !== handler);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
}

function loadRuntime(overrides = {}) {
  const bodyClasses = new Set();
  const documentListeners = {};
  const document = Object.assign({
    readyState: "complete",
    body: {
      classList: {
        add(value) { bodyClasses.add(value); },
        remove(value) { bodyClasses.delete(value); },
        contains(value) { return bodyClasses.has(value); },
      },
      style: { removeProperty() {} },
      appendChild() {},
    },
    addEventListener(type, handler) { (documentListeners[type] ||= []).push(handler); },
    removeEventListener(type, handler) {
      documentListeners[type] = (documentListeners[type] || []).filter((candidate) => candidate !== handler);
    },
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return makeElement(); },
    _listeners: documentListeners,
    _bodyClasses: bodyClasses,
  }, overrides.document || {});
  const window = Object.assign({
    location: { hostname: "example.org", pathname: "/app/" },
    innerWidth: 1024,
  }, overrides.window || {});
  const sandbox = {
    console,
    window,
    document,
    navigator: {},
    sessionStorage: makeStorage(),
    fetch: async (url) => { throw new Error(`unexpected fetch: ${url}`); },
    Element: RuntimeElement,
    URL,
    URLSearchParams,
    AbortController,
    Response,
    Headers,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (callback) => callback(),
    Image: function Image() {},
    ...overrides,
    window,
    document,
  };
  vm.createContext(sandbox);
  const appJs = fs.readFileSync(path.join(__dirname, "../app/app.js"), "utf8");
  vm.runInContext(appJs, sandbox, { filename: "app/app.js" });
  return sandbox;
}

function makeRoot() {
  const elements = new Map();
  const listeners = {};
  return {
    innerHTML: "",
    classList: makeElement().classList,
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, makeElement());
      return elements.get(selector);
    },
    querySelectorAll() { return []; },
    addEventListener(type, handler) { (listeners[type] ||= []).push(handler); },
    removeEventListener(type, handler) {
      listeners[type] = (listeners[type] || []).filter((candidate) => candidate !== handler);
    },
    dispatch(type, event) { (listeners[type] || []).forEach((handler) => handler(event)); },
    _elements: elements,
    _listeners: listeners,
  };
}

function makePoi(index) {
  return {
    id: `winery-${index}`,
    name: `Weingut ${index}`,
    description: "Weinbau",
    city: "Beispielstadt",
    street: "Rebweg 1",
    region: "Region",
    imageUrl: "",
    imageLicense: "",
    imageCopyright: "",
    images: [],
    distanceKm: index,
    lat: 48.5,
    lng: 9.1,
    wineCategories: ["weingut"],
    isWeingut: true,
    isVinothek: false,
    isBesen: false,
    isWeinstube: false,
    isProbe: false,
  };
}

module.exports = { RuntimeElement, loadRuntime, makeRoot, makePoi, makeElement, makeStorage };
