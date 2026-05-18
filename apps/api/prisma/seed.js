const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean up existing data to be idempotent
  await prisma.chunk.deleteMany({});
  await prisma.document.deleteMany({});

  const document = await prisma.document.create({
    data: {
      id: 'd3b07384-d113-4c92-a1f9-d587c10b784a',
      name: 'Sample Document.pdf',
      sourceUrl: 'https://example.com/sample.pdf',
      status: 'PROCESSED',
    },
  });

  console.log(`Created document: ${document.name} (ID: ${document.id})`);

  // Generate 768-dimensional mock embedding vectors
  const vector1 = Array.from({ length: 768 }, () => Math.random());
  const vector2 = Array.from({ length: 768 }, () => Math.random());

  const vectorString1 = `[${vector1.join(',')}]`;
  const vectorString2 = `[${vector2.join(',')}]`;

  // Insert chunks using raw SQL because of Unsupported("vector(768)")
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Chunk" ("id", "content", "embedding", "chunkIndex", "documentId") VALUES ($1, $2, $3::vector, $4, $5)`,
    'c1b07384-d113-4c92-a1f9-d587c10b784a',
    'This is the first chunk of the sample document, containing intro context.',
    vectorString1,
    0,
    document.id
  );

  await prisma.$executeRawUnsafe(
    `INSERT INTO "Chunk" ("id", "content", "embedding", "chunkIndex", "documentId") VALUES ($1, $2, $3::vector, $4, $5)`,
    'c2b07384-d113-4c92-a1f9-d587c10b784b',
    'This is the second chunk of the sample document, describing deeper details.',
    vectorString2,
    1,
    document.id
  );

  console.log('Successfully seeded 1 document with 2 chunks!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
