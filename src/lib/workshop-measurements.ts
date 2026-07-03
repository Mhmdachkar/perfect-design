/** PP Printing preset dropdown (cm). */
export const PP_MEASUREMENT_PRESETS = [
  "30×40 cm",
  "40×60 cm",
  "50×70 cm",
  "60×90 cm",
  "70×100 cm",
  "80×120 cm",
  "100×150 cm",
] as const;

/** Frame / photo block sizes (cm). */
export const FRAME_SIZES = [
  "10×15",
  "15×20",
  "20×30",
  "30×40",
  "30×50",
  "40×60",
  "50×70",
  "60×90",
  "80×120",
] as const;

export const PAPER_SIZES = ["A5", "A4", "A3"] as const;

export const STICKER_SIZES = ["A6", "A5", "A4", "A3"] as const;

export const STICKER_VINYL_SIZES = [...STICKER_SIZES, "Custom (cm)"] as const;

export const COVER_OPTIONS = ["With Cover", "Without Cover"] as const;

export type MeasurementKind =
  | "none"
  | "free_text"
  | "pp_preset"
  | "frame_size"
  | "paper_size"
  | "sticker_vinyl"
  | "sticker_paper";

export interface WorkshopProductDef {
  id: string;
  name: string;
  nameAr: string;
  categoryPath: string;
  groupId: string;
  basePrice?: number;
  measurementKind: MeasurementKind;
  requiresCover?: boolean;
}

export interface WorkshopProductGroup {
  id: string;
  label: string;
  labelAr: string;
  products: WorkshopProductDef[];
}

export const WORKSHOP_PRODUCT_GROUPS: WorkshopProductGroup[] = [
  {
    id: "curtains-store",
    label: "Curtains > Store",
    labelAr: "ستائر > جاهزة",
    products: [
      { id: "curtain-blackout", name: "Blackout", nameAr: "معتم", categoryPath: "Curtains > Store > Blackout", groupId: "curtains-store", measurementKind: "none", requiresCover: true },
      { id: "curtain-double", name: "Double", nameAr: "مزدوج", categoryPath: "Curtains > Store > Double", groupId: "curtains-store", measurementKind: "none", requiresCover: true },
      { id: "curtain-deo", name: "Deo", nameAr: "ديو", categoryPath: "Curtains > Store > Deo", groupId: "curtains-store", measurementKind: "none", requiresCover: true },
      { id: "curtain-iron", name: "Iron", nameAr: "حديد", categoryPath: "Curtains > Store > Iron", groupId: "curtains-store", measurementKind: "none", requiresCover: true },
    ],
  },
  {
    id: "curtains-custom",
    label: "Curtains > Custom",
    labelAr: "ستائر > مخصصة",
    products: [
      { id: "curtain-custom-blackout", name: "Custom Blackout", nameAr: "معتم مخصص", categoryPath: "Curtains > Custom > Blackout", groupId: "curtains-custom", measurementKind: "free_text", requiresCover: true },
      { id: "curtain-custom-double", name: "Custom Double", nameAr: "مزدوج مخصص", categoryPath: "Curtains > Custom > Double", groupId: "curtains-custom", measurementKind: "free_text", requiresCover: true },
      { id: "curtains-printing", name: "Curtains Printing", nameAr: "طباعة ستائر", categoryPath: "Curtains > Printing", groupId: "curtains-custom", measurementKind: "free_text", basePrice: 35 },
    ],
  },
  {
    id: "printing-flex",
    label: "Printing > Out > Flex",
    labelAr: "طباعة > خارجي > فليكس",
    products: [
      { id: "flex", name: "Flex", nameAr: "فليكس", categoryPath: "Printing > Printing Out > Flex Printing > Flex", groupId: "printing-flex", measurementKind: "free_text", basePrice: 8 },
      { id: "flex-with-wood", name: "Flex with Wood", nameAr: "فليكس مع خشب", categoryPath: "Printing > Printing Out > Flex Printing > Flex with Wood", groupId: "printing-flex", measurementKind: "free_text", basePrice: 15 },
      { id: "flex-wood-installation", name: "Flex and Wood with Installation", nameAr: "فليكس وخشب مع تركيب", categoryPath: "Printing > Printing Out > Flex Printing > Flex+Wood+Installation", groupId: "printing-flex", measurementKind: "free_text", basePrice: 25 },
    ],
  },
  {
    id: "printing-see-through",
    label: "Printing > See Through",
    labelAr: "طباعة > شفاف",
    products: [
      { id: "see-through-installation", name: "See Through with Installation", nameAr: "شفاف مع تركيب", categoryPath: "Printing > See Through > With Installation", groupId: "printing-see-through", measurementKind: "free_text", basePrice: 20 },
      { id: "see-through-no-installation", name: "See Through without Installation", nameAr: "شفاف بدون تركيب", categoryPath: "Printing > See Through > Without Installation", groupId: "printing-see-through", measurementKind: "free_text", basePrice: 12 },
    ],
  },
  {
    id: "printing-canva-vinnel",
    label: "Printing > Canva & Vinnel",
    labelAr: "طباعة > كانفا وفينيل",
    products: [
      { id: "canva", name: "Canva", nameAr: "كانفا", categoryPath: "Printing > Canva", groupId: "printing-canva-vinnel", measurementKind: "free_text", basePrice: 18 },
      { id: "canva-with-wood", name: "Canva with Wood", nameAr: "كانفا مع خشب", categoryPath: "Printing > Canva with Wood", groupId: "printing-canva-vinnel", measurementKind: "free_text", basePrice: 28 },
      { id: "vinnel-installation", name: "Vinnel with Installation", nameAr: "فينيل مع تركيب", categoryPath: "Printing > Vinnel > With Installation", groupId: "printing-canva-vinnel", measurementKind: "free_text", basePrice: 22 },
      { id: "vinnel-no-installation", name: "Vinnel without Installation", nameAr: "فينيل بدون تركيب", categoryPath: "Printing > Vinnel > Without Installation", groupId: "printing-canva-vinnel", measurementKind: "free_text", basePrice: 14 },
    ],
  },
  {
    id: "printing-pp",
    label: "Printing > PP Printing",
    labelAr: "طباعة > PP",
    products: [
      { id: "pp-printing", name: "PP Printing", nameAr: "طباعة PP", categoryPath: "Printing > Printing Out > PP Printing", groupId: "printing-pp", measurementKind: "pp_preset", basePrice: 5 },
    ],
  },
  {
    id: "printing-papers",
    label: "Printing > Papers",
    labelAr: "طباعة > أوراق",
    products: [
      { id: "paper-80g", name: "Printing Paper 80g", nameAr: "ورق 80غ", categoryPath: "Printing > Printing In > Printing Papers > 80g", groupId: "printing-papers", measurementKind: "paper_size" },
      { id: "paper-104g", name: "Printing Paper 104g", nameAr: "ورق 104غ", categoryPath: "Printing > Printing In > Printing Papers > 104g", groupId: "printing-papers", measurementKind: "paper_size" },
      { id: "paper-150g", name: "Printing Paper 150g", nameAr: "ورق 150غ", categoryPath: "Printing > Printing In > Printing Papers > 150g", groupId: "printing-papers", measurementKind: "paper_size" },
      { id: "paper-170g", name: "Printing Paper 170g", nameAr: "ورق 170غ", categoryPath: "Printing > Printing In > Printing Papers > 170g", groupId: "printing-papers", measurementKind: "paper_size" },
      { id: "paper-200g", name: "Printing Paper 200g", nameAr: "ورق 200غ", categoryPath: "Printing > Printing In > Printing Papers > 200g", groupId: "printing-papers", measurementKind: "paper_size" },
      { id: "paper-250g", name: "Printing Paper 250g", nameAr: "ورق 250غ", categoryPath: "Printing > Printing In > Printing Papers > 250g", groupId: "printing-papers", measurementKind: "paper_size" },
      { id: "paper-300g", name: "Printing Paper 300g", nameAr: "ورق 300غ", categoryPath: "Printing > Printing In > Printing Papers > 300g", groupId: "printing-papers", measurementKind: "paper_size" },
    ],
  },
  {
    id: "printing-stickers",
    label: "Printing > Stickers",
    labelAr: "طباعة > ملصقات",
    products: [
      { id: "vinnel-stickers", name: "Vinnel Stickers", nameAr: "ملصقات فينيل", categoryPath: "Printing > Stickers > Vinnel Stickers", groupId: "printing-stickers", measurementKind: "sticker_vinyl" },
      { id: "paper-stickers", name: "Paper Stickers", nameAr: "ملصقات ورق", categoryPath: "Printing > Stickers > Paper Stickers", groupId: "printing-stickers", measurementKind: "sticker_paper" },
    ],
  },
  {
    id: "frames",
    label: "Frames / Photo Block",
    labelAr: "برواز / فوتو بلوك",
    products: [
      { id: "frame", name: "Frame", nameAr: "برواز", categoryPath: "Frames > Frame", groupId: "frames", measurementKind: "frame_size" },
      { id: "frame-with-photo", name: "Frame with Photo", nameAr: "برواز مع صورة", categoryPath: "Frames > Frame with Photo", groupId: "frames", measurementKind: "frame_size" },
      { id: "photo-block", name: "Photo Block", nameAr: "فوتو بلوك", categoryPath: "Frames > Photo Block", groupId: "frames", measurementKind: "frame_size" },
      { id: "photo-block-with-photo", name: "Photo Block with Photo", nameAr: "فوتو بلوك مع صورة", categoryPath: "Frames > Photo Block with Photo", groupId: "frames", measurementKind: "frame_size" },
    ],
  },
  {
    id: "libraries",
    label: "Sales / Libraries",
    labelAr: "مبيعات / مكتبات",
    products: [
      { id: "paper-tray-a5", name: "Paper Tray A5", nameAr: "صينية ورق A5", categoryPath: "Sales / Libraries > Paper Trays > A5", groupId: "libraries", measurementKind: "none" },
      { id: "paper-tray-a4", name: "Paper Tray A4", nameAr: "صينية ورق A4", categoryPath: "Sales / Libraries > Paper Trays > A4", groupId: "libraries", measurementKind: "none" },
      { id: "paper-tray-a3", name: "Paper Tray A3", nameAr: "صينية ورق A3", categoryPath: "Sales / Libraries > Paper Trays > A3", groupId: "libraries", measurementKind: "none" },
      { id: "envelope-white-a4", name: "White Envelope A4", nameAr: "ظرف أبيض A4", categoryPath: "Sales / Libraries > Envelopes > White > A4", groupId: "libraries", measurementKind: "none" },
      { id: "scotch-tape-1cm", name: "Scotch Tape 1 cm", nameAr: "شريط لاصق 1 سم", categoryPath: "Sales / Libraries > Scotch Tape > 1 cm", groupId: "libraries", measurementKind: "none" },
      { id: "scotch-tape-2cm", name: "Scotch Tape 2 cm", nameAr: "شريط لاصق 2 سم", categoryPath: "Sales / Libraries > Scotch Tape > 2 cm", groupId: "libraries", measurementKind: "none" },
    ],
  },
];

export function findWorkshopProduct(id: string | null | undefined): WorkshopProductDef | undefined {
  if (!id) return undefined;
  for (const group of WORKSHOP_PRODUCT_GROUPS) {
    const product = group.products.find((p) => p.id === id);
    if (product) return product;
  }
  return undefined;
}

export function findWorkshopGroup(id: string | null | undefined): WorkshopProductGroup | undefined {
  if (!id) return undefined;
  return WORKSHOP_PRODUCT_GROUPS.find((g) => g.id === id);
}

export type WorkshopProductFormState = {
  groupId: string;
  productId: string;
  cover: string;
  measurement: string;
  size: string;
  customMeasurement: string;
  customStickerSize: string;
};

export function emptyProductFormState(): WorkshopProductFormState {
  return {
    groupId: "",
    productId: "",
    cover: "",
    measurement: "",
    size: "",
    customMeasurement: "",
    customStickerSize: "",
  };
}

export function validateWorkshopProduct(
  product: WorkshopProductDef | undefined,
  state: WorkshopProductFormState,
): string | null {
  if (!product) return "workshopProduct.productRequired";

  if (product.requiresCover && !state.cover) return "workshopProduct.coverRequired";

  switch (product.measurementKind) {
    case "free_text":
      if (!state.customMeasurement.trim()) return "workshopProduct.customMeasurementRequired";
      break;
    case "pp_preset":
      if (!state.measurement) return "workshopProduct.measurementRequired";
      break;
    case "frame_size":
    case "paper_size":
    case "sticker_paper":
      if (!state.size) return "workshopProduct.sizeRequired";
      break;
    case "sticker_vinyl":
      if (!state.size) return "workshopProduct.sizeRequired";
      if (state.size === "Custom (cm)" && !state.customStickerSize.trim()) {
        return "workshopProduct.customStickerSizeRequired";
      }
      break;
    default:
      break;
  }

  return null;
}

export function buildOptionsSnapshot(
  product: WorkshopProductDef,
  state: WorkshopProductFormState,
): Record<string, string> {
  const options: Record<string, string> = { productId: product.id };
  if (state.cover) options.cover = state.cover;
  if (product.measurementKind === "pp_preset" && state.measurement) {
    options.measurement = state.measurement;
  }
  if (
    (product.measurementKind === "frame_size" ||
      product.measurementKind === "paper_size" ||
      product.measurementKind === "sticker_paper" ||
      product.measurementKind === "sticker_vinyl") &&
    state.size
  ) {
    options.size = state.size;
  }
  if (state.size === "Custom (cm)" && state.customStickerSize.trim()) {
    options["custom-size"] = state.customStickerSize.trim();
  }
  return options;
}

export function productFormStateFromWorkshop(w: {
  product_ref_id?: string | null;
  options_snapshot?: Record<string, string> | null;
  custom_measurement?: string | null;
}): WorkshopProductFormState {
  const product = findWorkshopProduct(w.product_ref_id ?? undefined);
  const opts = (w.options_snapshot ?? {}) as Record<string, string>;
  return {
    groupId: product?.groupId ?? "",
    productId: w.product_ref_id ?? "",
    cover: opts.cover ?? "",
    measurement: opts.measurement ?? "",
    size: opts.size ?? "",
    customMeasurement: w.custom_measurement ?? "",
    customStickerSize: opts["custom-size"] ?? "",
  };
}
