import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const prisma = new PrismaClient();

export async function main() {
  // Create default statuses
  const statuses = [
    { name: 'Open', isClosable: false, sortOrder: 1 },
    { name: 'Specification', isClosable: false, sortOrder: 2 },
    { name: 'Waiting', isClosable: false, sortOrder: 3 },
    { name: 'Ready', isClosable: false, sortOrder: 4 },
    { name: 'In Progress', isClosable: false, sortOrder: 5 },
    { name: 'Review', isClosable: false, sortOrder: 6 },
    { name: 'Testing', isClosable: false, sortOrder: 7 },
    { name: 'Pending', isClosable: false, sortOrder: 8 },
    { name: 'Completed', isClosable: true, sortOrder: 9 },
    { name: 'Closed', isClosable: true, sortOrder: 10 },
    { name: 'Canceled', isClosable: true, sortOrder: 11 },
    { name: 'Rejected', isClosable: true, sortOrder: 12 },
  ];

  for (const status of statuses) {
    await prisma.status.upsert({
      where: { name: status.name },
      update: {},
      create: status,
    });
  }

  console.log('Seeded statuses');
}

// Run if called directly
if (process.argv[1] && (process.argv[1] === __filename || process.argv[1].endsWith('/seed.ts'))) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}