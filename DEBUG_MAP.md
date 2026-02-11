# 🐛 Debug: Polígonos no se muestran en el mapa

## Pasos para diagnosticar:

### 1. Abre la consola del navegador
- Chrome/Edge: `F12` o `Ctrl+Shift+I`
- Firefox: `F12` o `Ctrl+Shift+K`
- Safari: `Cmd+Option+I`

### 2. Ve a la pestaña "Console"

### 3. Busca estos mensajes en este orden:

```
🔄 Fetching polygons from Appwrite...
✅ Fetched polygons: [número]
📊 First polygon sample: [datos]
🗺️ Municipalities data prepared: [número]
```

**Si NO ves estos mensajes:**
- Los polígonos no se están cargando desde Appwrite
- Verifica la conexión a Appwrite
- Revisa que existan claims con `datatype='polygon'`

---

```
🔄 useEffect triggered - Map: true Municipalities: [número]
✅ Both map and municipalities ready, proceeding to add layers
```

**Si ves `Municipalities: 0`:**
- Los polígonos no se cargaron correctamente de Appwrite
- Revisa los mensajes anteriores

**Si ves `Map: false`:**
- El mapa no se ha inicializado
- Problema con MapLibre

---

```
🎨 Adding municipality layers to map...
📍 Municipalities available: [número]
📦 GeoJSON created with [número] features
🔍 First feature sample: {...}
✅ GeoJSON source added to map
✅ All 3 layers added successfully (fill, border, labels)
🎨 Map layers: [lista de ids]
```

**Si NO ves estos mensajes:**
- El mapa no está listo cuando los municipios se cargan
- Problema de timing en useEffect

**Si ves un error `❌ Error adding municipality layers:`:**
- Hay un problema al agregar las capas al mapa
- Revisa el mensaje de error completo

---

### 4. Verificaciones adicionales

#### En la consola, ejecuta:
```javascript
// Ver si hay datos de municipios
window.__municipalities = true; 
```

#### Revisa la pestaña "Network"
- Busca requests a `appwrite.sociest.org`
- Verifica que las URLs de GeoJSON se descarguen correctamente

---

## Posibles problemas y soluciones:

### ❌ No se cargan polígonos desde Appwrite
**Solución:** Verifica en Appwrite Console → Database → Claims:
- Query: `datatype` equal to `'polygon'`
- Debe haber al menos 1 resultado

### ❌ URLs de GeoJSON inválidas
**Solución:** Verifica que `value_raw` contiene URLs válidas:
```
https://appwrite.sociest.org/v1/storage/buckets/.../files/.../view?project=...
```

### ❌ Formato incorrecto de coordenadas
**Solución:** El GeoJSON debe tener este formato:
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [-65.123, -16.456],
        [-65.234, -16.567],
        ...
      ]
    ]
  }
}
```

### ❌ Timing issue (municipios cargan después del mapa)
**Solución:** El código ya maneja esto con useEffect, pero si persiste:
- Aumenta el `Query.limit(100)` en fetchPolygons
- Verifica que no haya errores de red

---

## 📸 Comparte este output

Por favor copia y pega TODOS los logs de la consola que empiezan con emojis:
- 🔄 🔄 ✅ 📊 🗺️ 🎨 📍 📦 🔍 ✅ ⏸️ ⚠️ ❌

Esto me ayudará a identificar exactamente dónde está el problema.
