import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventories: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    const formatted = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      warehouses: product.inventories.map((inv) => ({
        inventoryId: inv.id,
        warehouseId: inv.warehouseId,
        warehouseName: inv.warehouse.name,
        location: inv.warehouse.location,
        totalStock: inv.totalStock,
        reserved: inv.reserved,
        available: inv.totalStock - inv.reserved,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}