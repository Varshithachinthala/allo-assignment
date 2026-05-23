import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const warehouseA = await prisma.warehouse.create({
    data: {
      name: "Mumbai Warehouse",
      location: "Mumbai, India",
    },
  });

  const warehouseB = await prisma.warehouse.create({
    data: {
      name: "Delhi Warehouse",
      location: "Delhi, India",
    },
  });

  const warehouseC = await prisma.warehouse.create({
    data: {
      name: "Bangalore Warehouse",
      location: "Bangalore, India",
    },
  });

  console.log("✓ Warehouses created");

  const product1 = await prisma.product.create({
    data: {
      name: "Nike Air Max 90",
      description: "Classic running shoes with Air cushioning",
      price: 8999,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "Sony WH-1000XM5",
      description: "Industry leading noise cancelling headphones",
      price: 29999,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: "Apple iPhone 15",
      description: "Latest iPhone with Dynamic Island",
      price: 79999,
    },
  });

  const product4 = await prisma.product.create({
    data: {
      name: "Levis 501 Jeans",
      description: "Original straight fit jeans",
      price: 3999,
    },
  });

  console.log("✓ Products created");

  await prisma.inventory.createMany({
    data: [
      { productId: product1.id, warehouseId: warehouseA.id, totalStock: 50, reserved: 0 },
      { productId: product1.id, warehouseId: warehouseB.id, totalStock: 30, reserved: 0 },
      { productId: product1.id, warehouseId: warehouseC.id, totalStock: 2, reserved: 0 },
      { productId: product2.id, warehouseId: warehouseA.id, totalStock: 15, reserved: 0 },
      { productId: product2.id, warehouseId: warehouseB.id, totalStock: 8, reserved: 0 },
      { productId: product3.id, warehouseId: warehouseA.id, totalStock: 1, reserved: 0 },
      { productId: product3.id, warehouseId: warehouseC.id, totalStock: 3, reserved: 0 },
      { productId: product4.id, warehouseId: warehouseB.id, totalStock: 100, reserved: 0 },
      { productId: product4.id, warehouseId: warehouseC.id, totalStock: 45, reserved: 0 },
    ],
  });

  console.log("✓ Inventory created");
  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });