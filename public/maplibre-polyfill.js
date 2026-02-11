// Polyfill for __publicField issue in MapLibre GL
// This fixes a transpilation issue between TypeScript and MapLibre's Web Workers
// MUST be loaded before any imports of maplibre-gl

(function() {
  'use strict';
  
  function definePublicField(obj, key, value) {
    try {
      Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: value
      });
    } catch (e) {
      // Fallback for environments where defineProperty might fail
      obj[key] = value;
    }
  }

  // Apply to all possible global contexts
  const contexts = [];
  
  if (typeof window !== 'undefined') {
    contexts.push(window);
  }
  
  if (typeof globalThis !== 'undefined') {
    contexts.push(globalThis);
  }
  
  if (typeof self !== 'undefined') {
    contexts.push(self);
  }
  
  if (typeof global !== 'undefined') {
    contexts.push(global);
  }
  
  // Define __publicField in all contexts
  contexts.forEach(function(ctx) {
    if (!ctx.__publicField) {
      ctx.__publicField = definePublicField;
    }
  });
  
  // Log for debugging (remove in production)
  if (typeof console !== 'undefined' && console.log) {
    console.log('✅ MapLibre __publicField polyfill loaded');
  }
})();
