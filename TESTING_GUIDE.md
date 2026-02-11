# 🧪 Cómo Probar la Corrección de Polígonos

## ✅ El Diagnóstico Muestra

Según tu resultado del diagnóstico:
- ✅ **100 claims** con polígonos encontrados
- ✅ **URLs accesibles** (200 OK)
- ✅ **Formato MultiPolygon** válido
- ✅ **Sin errores CORS**

**Conclusión**: Los archivos se descargan correctamente. El problema está en el código de procesamiento.

## 🚀 Prueba 1: Test de Carga

1. Abre: **http://localhost:4321/test-load-polygons**

2. Haz clic en "Cargar Polígonos"

3. Deberías ver:
   ```
   ✅ Cargados 100 polígonos en X.XXs
   
   Por nivel administrativo:
     Nivel 3 (Municipio): XX
     Nivel 2 (Provincia): XX
     Nivel 1 (Departamento): XX
   ```

4. **Revisa los primeros 5 polígonos** y verifica que tengan:
   - ✅ Coordinate rings: 1 o más
   - ✅ First ring points: 3 o más
   - ✅ Estructura válida

### 📝 Si ves errores:

**Error: "coordinates no es un array"**
→ El parseador no está funcionando. Comparte los logs.

**Error: "primer ring tiene solo X puntos"**
→ El GeoJSON está corrupto.

**Error: "Failed to fetch"**
→ Problemas de red o CORS (pero el diagnóstico dice que no hay).

## 🗺️ Prueba 2: Mapa Principal

1. Abre: **http://localhost:4321**

2. Abre la consola del navegador (F12)

3. Busca estos mensajes:
   ```
   🔄 Fetching polygons from Appwrite...
   ✅ Fetched polygons: 100
   📦 GeoJSON created with 100 features
   ✅ GeoJSON source added to map successfully
   ```

4. **Si NO ves los mensajes**:
   - Limpia el caché del navegador (Ctrl+Shift+R)
   - Verifica que no haya errores en rojo en la consola

5. **Si ves los mensajes pero no ves polígonos**:
   - Busca errores de MapLibre
   - Verifica que las capas se agregaron: busca "municipalities-fill"

### 🐛 Debugging en la Consola

Ejecuta esto en la consola del navegador:

```javascript
// Ver si el origen del mapa tiene datos
const map = window.__map; // Si MapView expone el mapa
if (map) {
  const source = map.getSource('municipalities');
  console.log('Source:', source);
  console.log('Layers:', map.getStyle().layers.filter(l => l.id.includes('municipal')));
}
```

## 🔧 Cambios Realizados

### 1. Storage SDK ([appwrite.ts](src/lib/appwrite.ts))
```typescript
export const storage = new Storage(client);
```

### 2. Mejor parsing de MultiPolygon ([queries.ts](src/lib/queries.ts))
```typescript
function parseGeoJsonCoordinates(geoJsonData, claimId, isFirst) {
  if (geoJsonData.type === 'MultiPolygon') {
    return geoJsonData.coordinates[0]; // Primer polígono
  }
  // ... otros formatos
}
```

### 3. Manejo de errores mejorado
```typescript
// Intenta SDK → Fallback a fetch directo → Logs detallados
```

## 📊 Qué Esperar

Con 100 polígonos cargados correctamente deberías ver:

1. **En test-load-polygons**:
   - ✅ Tiempo de carga < 5 segundos
   - ✅ Todos los polígonos con estructura válida
   - ✅ Coordenadas en formato correcto [lon, lat]

2. **En el mapa principal**:
   - 🗺️ Mapa de Bolivia con polígonos dibujados
   - 🎨 Colores según nivel administrativo
   - 🖱️ Interacción al hacer hover
   - 💬 Tooltip mostrando nombres

## ❓ Solución de Problemas

### Problema: No se cargan polígonos en test-load-polygons

**Causa**: Error en fetchPolygons()

**Solución**:
1. Abre la consola y copia TODOS los logs
2. Busca líneas con `[ERROR]` o `[WARN]`
3. Comparte los logs para identificar el problema específico

### Problema: Se cargan pero no se ven en el mapa

**Causa**: Error en MapLibre al agregar las capas

**Solución**:
1. Busca en consola: `❌ Error adding municipality layers`
2. Busca errores de MapLibre (suelen ser en rojo)
3. Verifica que el JSON sea serializable
4. Intenta reducir el número de polígonos para probar (modifica el límite en queries.ts)

### Problema: CORS errors aparecen

**Causa**: Configuración de Appwrite

**Solución**:
1. Ve a Appwrite Console → Storage
2. Bucket `6982ca130039bc0ee4e2`
3. Settings → Permissions
4. Agrega: `read("any")`
5. Settings → Platform
6. Agrega: `http://localhost:4321`

## 🎯 Siguiente Paso

1. **Ejecuta test-load-polygons**: `/test-load-polygons`
2. **Comparte los resultados**: Copia el output completo
3. **Revisa el mapa**: Ve a `/` y abre la consola
4. **Comparte los logs de consola**: Especialmente errores en rojo

Con esa información podré identificar exactamente dónde está fallando.
