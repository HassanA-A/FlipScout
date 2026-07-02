import type { CatalogComponent } from "./types";

/**
 * Seed price database. In production these values live in Postgres and are
 * updated by provenance-tracked price points (own sales > eBay solds > asks).
 * Values here are used/local market ballparks — edit them on the Prices page.
 */
export const CATALOG: CatalogComponent[] = [
  // GPUs
  { id: "gpu-rtx-3080", category: "gpu", name: "RTX 3080 10GB", aliases: ["rtx 3080", "rtx3080", "3080"], buyValue: 330, resaleValue: 400 },
  { id: "gpu-rtx-3070", category: "gpu", name: "RTX 3070", aliases: ["rtx 3070", "rtx3070", "3070"], buyValue: 240, resaleValue: 290 },
  { id: "gpu-rtx-3060-ti", category: "gpu", name: "RTX 3060 Ti", aliases: ["rtx 3060 ti", "3060 ti", "3060ti"], buyValue: 200, resaleValue: 240 },
  { id: "gpu-rtx-3060", category: "gpu", name: "RTX 3060 12GB", aliases: ["rtx 3060", "rtx3060", "3060"], buyValue: 170, resaleValue: 210 },
  { id: "gpu-rtx-4060", category: "gpu", name: "RTX 4060", aliases: ["rtx 4060", "rtx4060", "4060"], buyValue: 230, resaleValue: 270 },
  { id: "gpu-rtx-2060", category: "gpu", name: "RTX 2060", aliases: ["rtx 2060", "rtx2060", "2060"], buyValue: 110, resaleValue: 140 },
  { id: "gpu-gtx-1660s", category: "gpu", name: "GTX 1660 Super", aliases: ["1660 super", "1660s", "gtx 1660", "1660"], buyValue: 85, resaleValue: 110 },
  { id: "gpu-rx-6600", category: "gpu", name: "RX 6600", aliases: ["rx 6600", "rx6600", "6600 xt", "6600"], buyValue: 140, resaleValue: 175 },
  { id: "gpu-rx-580", category: "gpu", name: "RX 580 8GB", aliases: ["rx 580", "rx580", "580"], buyValue: 55, resaleValue: 75 },

  // CPUs
  { id: "cpu-5800x", category: "cpu", name: "Ryzen 7 5800X", aliases: ["5800x", "ryzen 7 5800"], buyValue: 130, resaleValue: 160 },
  { id: "cpu-5600x", category: "cpu", name: "Ryzen 5 5600X", aliases: ["5600x", "ryzen 5 5600x", "5600"], buyValue: 85, resaleValue: 110 },
  { id: "cpu-3600", category: "cpu", name: "Ryzen 5 3600", aliases: ["ryzen 5 3600", "r5 3600", "3600"], buyValue: 55, resaleValue: 75 },
  { id: "cpu-12400f", category: "cpu", name: "Core i5-12400F", aliases: ["i5-12400f", "12400f", "i5 12400"], buyValue: 90, resaleValue: 115 },
  { id: "cpu-10700k", category: "cpu", name: "Core i7-10700K", aliases: ["i7-10700k", "10700k", "i7 10700"], buyValue: 110, resaleValue: 140 },

  // RAM
  { id: "ram-32-ddr4", category: "ram", name: "32GB DDR4 3200", aliases: ["32gb ddr4", "32 gb ddr4", "32gb ram", "32gb"], buyValue: 50, resaleValue: 65 },
  { id: "ram-16-ddr4", category: "ram", name: "16GB DDR4 3200", aliases: ["16gb ddr4", "16 gb ddr4", "16gb ram", "16gb"], buyValue: 25, resaleValue: 35 },

  // Storage
  { id: "sto-1tb-nvme", category: "storage", name: "1TB NVMe SSD", aliases: ["1tb nvme", "1tb ssd", "1 tb ssd", "1tb m.2"], buyValue: 40, resaleValue: 55 },
  { id: "sto-500-ssd", category: "storage", name: "500GB SSD", aliases: ["500gb ssd", "512gb ssd", "500 gb ssd", "512gb nvme"], buyValue: 20, resaleValue: 28 },

  // PSU
  { id: "psu-750-gold", category: "psu", name: "750W 80+ Gold PSU", aliases: ["750w gold", "750 watt gold", "750w psu", "750w"], buyValue: 55, resaleValue: 75 },
  { id: "psu-650-gold", category: "psu", name: "650W 80+ Gold PSU", aliases: ["650w gold", "650 watt", "650w psu", "650w"], buyValue: 45, resaleValue: 60 },

  // Motherboards
  { id: "mobo-b550", category: "mobo", name: "B550 Motherboard", aliases: ["b550"], buyValue: 70, resaleValue: 90 },
  { id: "mobo-b450", category: "mobo", name: "B450 Motherboard", aliases: ["b450"], buyValue: 45, resaleValue: 60 },

  // Case & cooling
  { id: "case-mid", category: "case", name: "Mid-tower ATX case", aliases: ["mid tower", "atx case", "nzxt h510", "4000d", "meshify"], buyValue: 25, resaleValue: 40 },
  { id: "cool-aio-240", category: "cooler", name: "240mm AIO cooler", aliases: ["240mm aio", "aio cooler", "liquid cooler", "aio"], buyValue: 40, resaleValue: 55 },
];

export function getCatalog(
  overrides: Record<string, { buyValue: number; resaleValue: number }> = {}
): CatalogComponent[] {
  return CATALOG.map((c) =>
    overrides[c.id] ? { ...c, ...overrides[c.id] } : c
  );
}
