const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  console.log('PRODUCTS IN DB:');
  products.forEach(p => {
    console.log(`- ID: ${p.id} | SKU: ${p.sku} | Name: ${p.name}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
