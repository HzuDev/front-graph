/**
 * Script para encontrar el ID de Tarija en la base de datos
 * 
 * Ejecutar con: npx tsx scripts/find-tarija-id.ts
 */

import { databases, DATABASE_ID, COLLECTIONS, Query } from '../src/lib/appwrite';

async function findTarijaId() {
  console.log('🔍 Buscando ID de Tarija en la base de datos...\n');

  try {
    // Buscar entidad con label "Tarija"
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ENTITIES,
      [
        Query.equal('label', 'Tarija'),
        Query.limit(10)
      ]
    );

    console.log(`📊 Entidades encontradas con label "Tarija": ${response.documents.length}\n`);

    if (response.documents.length === 0) {
      console.log('❌ No se encontró ninguna entidad con label "Tarija"');
      console.log('\n💡 Intenta buscar variaciones:');
      console.log('   - "Departamento de Tarija"');
      console.log('   - "TARIJA"');
      console.log('   - Revisa la base de datos manualmente');
      return;
    }

    console.log('✅ Entidades encontradas:\n');
    response.documents.forEach((entity: any, index: number) => {
      console.log(`${index + 1}. ID: ${entity.$id}`);
      console.log(`   Label: ${entity.label}`);
      console.log(`   Description: ${entity.description || 'N/A'}`);
      console.log(`   Aliases: ${entity.aliases?.join(', ') || 'N/A'}`);
      console.log('');
    });

    console.log('\n📝 Para actualizar el código, usa este ID en src/lib/queries/constants.ts:');
    console.log(`   'Tarija': '${response.documents[0].$id}',`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findTarijaId();
