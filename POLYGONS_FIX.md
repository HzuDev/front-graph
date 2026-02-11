# 🔧 Solución: Problemas con Renderizado de Polígonos GeoJSON

## 🐛 Problema Identificado

Los polígonos no se renderizaban en el mapa debido a múltiples problemas en la carga de archivos GeoJSON desde Appwrite Storage:

### Problemas Principales:

1. **Falta del módulo Storage**: El SDK de Appwrite Storage no estaba configurado
2. **CORS y Autenticación**: Las URLs directas pueden requerir autenticación o tener problemas de CORS
3. **Manejo de errores insuficiente**: No había diagnóstico claro de por qué fallaban las descargas
4. **Parsing de URLs**: No se extraían correctamente los IDs de bucket y file desde las URLs

## ✅ Soluciones Implementadas

### 1. Agregado módulo Storage de Appwrite

**Archivo**: [`src/lib/appwrite.ts`](src/lib/appwrite.ts)

```typescript
import { Storage } from 'appwrite';

export const storage = new Storage(client);
export const GEOJSON_BUCKET_ID = '6982ca130039bc0ee4e2';
```

### 2. Mejorada función `fetchPolygons()`

**Archivo**: [`src/lib/queries.ts`](src/lib/queries.ts)

**Mejoras implementadas**:

- ✅ Extracción de `bucketId` y `fileId` desde URLs de Appwrite
- ✅ Uso del SDK de Storage para obtener URLs autenticadas
- ✅ Fallback a fetch directo si SDK falla
- ✅ Mejor manejo de errores con logs detallados
- ✅ Validación de coordenadas antes de agregar al array
- ✅ Función helper `parseGeoJsonCoordinates()` para diferentes formatos

### 3. Página de Diagnóstico

**Nueva página**: [`/debug-geojson`](/debug-geojson)

Herramienta interactiva para diagnosticar problemas:

- 🔍 Verifica claims con `datatype='polygon'`
- 🧪 Prueba descarga de archivos GeoJSON desde URLs
- ✅ Valida formato de datos
- 💡 Sugiere soluciones según el tipo de error detectado

## 🚀 Cómo Usar

### Paso 1: Ejecuta la página de diagnóstico

```bash
# Inicia el servidor de desarrollo si no está corriendo
pnpm dev
```

Luego abre: http://localhost:4321/debug-geojson

### Paso 2: Verifica los Claims

Haz clic en "Verificar Claims" para asegurarte de que:
- Hay claims con `datatype='polygon'`
- Los `value_raw` contienen URLs válidas
- Las URLs apuntan a Appwrite Storage

### Paso 3: Prueba las URLs

Copia una URL de ejemplo del paso anterior y pruébala en "Probar URL":

```
https://appwrite.sociest.org/v1/storage/buckets/6982ca130039bc0ee4e2/files/698912320014144110dd/view?project=697ea96f003c3264105c&mode=admin
```

### Paso 4: Valida Todo

Haz clic en "Validar Todo" para ejecutar un diagnóstico completo.

## 🔍 Formatos de GeoJSON Soportados

La función ahora reconoce automáticamente estos formatos:

### 1. Feature con Polygon
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  }
}
```

### 2. Feature con MultiPolygon
```json
{
  "type": "Feature",
  "geometry": {
    "type": "MultiPolygon",
    "coordinates": [[[[lon, lat], ...]]]
  }
}
```

### 3. Polygon directo
```json
{
  "type": "Polygon",
  "coordinates": [[[lon, lat], [lon, lat], ...]]
}
```

### 4. Array de coordenadas directo
```json
[[[lon, lat], [lon, lat], ...]]
```

## 🐛 Posibles Problemas y Soluciones

### ❌ Error: CORS o "Failed to fetch"

**Causa**: El bucket de Appwrite no permite peticiones desde el navegador.

**Solución**:

1. **Opción A - Permisos públicos** (Recomendado):
   - Ve a Appwrite Console → Storage
   - Selecciona el bucket `6982ca130039bc0ee4e2`
   - En "Settings" → "Permissions"
   - Agrega permiso de lectura `read("any")`

2. **Opción B - CORS**:
   - Ve a Appwrite Console → Settings
   - En "Platforms" agrega tu dominio
   - Ejemplo: `http://localhost:4321` para desarrollo

### ❌ Error: 401 Unauthorized

**Causa**: Las URLs requieren autenticación.

**Solución**: El código actualizado usa ahora `storage.getFileView()` que maneja la autenticación automáticamente.

### ❌ Error: 404 Not Found

**Causa**: Los archivos no existen en el bucket o los IDs son incorrectos.

**Solución**:
1. Verifica en Appwrite Console que los archivos existen
2. Comprueba que las URLs en `value_raw` son correctas
3. Actualiza `GEOJSON_BUCKET_ID` si usas un bucket diferente

### ❌ No se ven polígonos en el mapa

**Pasos de diagnóstico**:

1. Abre la consola del navegador (F12)
2. Busca estos mensajes:
   ```
   ✅ Fetched polygons: [número]
   📦 GeoJSON created with [número] features
   ✅ GeoJSON source added to map
   ```
3. Si ves errores `⚠️ Failed to fetch`, sigue las soluciones arriba
4. Si ves `❌ Unknown GeoJSON format`, revisa el formato de tus archivos

## 📚 Archivos Modificados

- ✅ [`src/lib/appwrite.ts`](src/lib/appwrite.ts) - Agregado módulo Storage
- ✅ [`src/lib/queries.ts`](src/lib/queries.ts) - Mejorada `fetchPolygons()`
- ✅ [`src/pages/debug-geojson.astro`](src/pages/debug-geojson.astro) - Nueva página de diagnóstico

## 🎯 Próximos Pasos

1. **Ejecuta la página de diagnóstico**: `/debug-geojson`
2. **Verifica los resultados** de cada paso
3. **Aplica las soluciones** sugeridas según los errores encontrados
4. **Revisa la consola del navegador** al cargar el mapa en `/`
5. **Reporta** cualquier error específico con los logs de la consola

## 💡 Consejos

- Usa `mode=admin` solo en desarrollo, nunca en producción
- Considera cachear los GeoJSON en el cliente para mejorar rendimiento
- Si tienes muchos polígonos (>100), implementa paginación o lazy loading
- Los archivos GeoJSON grandes (>500KB) pueden afectar rendimiento

---

**¿Necesitas ayuda adicional?** Abre `/debug-geojson` y comparte los resultados de la validación.
