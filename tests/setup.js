// Mock de localStorage para correr los tests en Node (sin navegador).
class LocalStorageMock {
  constructor() { this.store = {}; }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null; }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
  clear() { this.store = {}; }
}

globalThis.localStorage = new LocalStorageMock();

import { beforeEach } from 'vitest';
beforeEach(() => localStorage.clear());
