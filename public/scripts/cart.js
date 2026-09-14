// LexCart — Store global del carrito
// Persiste en localStorage, emite eventos cart:updated

(function () {
  'use strict';

  const STORAGE_KEY = 'lex_cart';
  const EVENT_NAME = 'cart:updated';

  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('[LexCart] Error leyendo localStorage:', e);
      return [];
    }
  }

  function write(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      emit(items);
    } catch (e) {
      console.error('[LexCart] Error escribiendo localStorage:', e);
    }
  }

  function emit(items) {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { items: items } })
    );
  }

  function add(item) {
    if (!item || !item.sku) {
      console.warn('[LexCart] add() requiere un item con sku');
      return;
    }
    const items = read();
    const existing = items.find((i) => i.sku === item.sku);
    if (existing) {
      existing.cantidad = (existing.cantidad || 1) + 1;
    } else {
      items.push({
        sku: item.sku,
        titulo: item.titulo,
        precioCOP: item.precioCOP || 0,
        portada: item.portada || '',
        slug: item.slug || '',
        cantidad: 1,
      });
    }
    write(items);
  }

  function remove(sku) {
    const items = read().filter((i) => i.sku !== sku);
    write(items);
  }

  function clear() {
    write([]);
  }

  function getAll() {
    return read();
  }

  function count() {
    return read().reduce((sum, i) => sum + (i.cantidad || 1), 0);
  }

  function subtotal() {
    return read().reduce(
      (sum, i) => sum + (i.precioCOP || 0) * (i.cantidad || 1),
      0
    );
  }

  function has(sku) {
    return read().some((i) => i.sku === sku);
  }

  function setQuantity(sku, cantidad) {
    const items = read();
    const item = items.find((i) => i.sku === sku);
    if (!item) return;
    if (cantidad <= 0) {
      remove(sku);
      return;
    }
    item.cantidad = cantidad;
    write(items);
  }

  window.LexCart = {
    add,
    remove,
    clear,
    getAll,
    count,
    subtotal,
    has,
    setQuantity,
    EVENT_NAME,
  };

  console.log('[LexCart] Listo. Items actuales:', count());
})();