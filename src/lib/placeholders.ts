/** Input placeholders tailored for Perfect Design — curtains, printing, frames & office supplies. */
export const ph = {
  client: {
    fullName: "e.g. Ahmad Hassan — hotel contact",
    whatsapp: "+961 3 123 456",
    city: "Beirut, Tripoli, Saida…",
    email: "sales@client-company.com",
    company: "Hotel, restaurant, or construction company",
    address: "Building, floor, area, city…",
    search: "Search clients, WhatsApp, city, or company…",
  },
  workshop: {
    name: "e.g. Blackout curtains — master bedroom",
    type: "Curtains, Printing, Frames, Office supplies",
    amount: "Quote total (USD or LBP)",
    discount: "Bulk or loyalty discount",
    description: "Fabric, dimensions, flex/vinyl specs, installation…",
    search: "Search orders, clients, or product type…",
    selectClient: "Select client (home, hotel, restaurant…)",
  },
  expense: {
    name: "Flex vinyl roll, curtain fabric, stationery…",
    amount: "0.00",
    vendor: "Printing supplier, fabric wholesaler…",
  },
  payment: {
    amount: "0.00",
    reference: "Quote #, invoice #, receipt #…",
    notes: "Deposit, balance, or installation payment…",
    selectClient: "Select client",
  },
  settings: {
    businessName: "Perfect Design",
    email: "info@perfectdesign.com",
    phone: "+961 1 234 567",
    address: "Showroom or office address",
    invoiceFooter: "Curtains · Printing · Frames · Office supplies",
    logoUrl: "https://…",
    exchangeRate: "USD → LBP rate",
  },
  auth: {
    name: "Your full name",
    email: "you@perfectdesign.com",
    password: "••••••••",
  },
  notes: {
    new: "Measurement follow-up, delivery date, client request…",
    edit: "Edit note…",
  },
  tag: "Curtains, Printing, VIP client…",
  filter: "Save current filters as…",
  paymentsSearch: "Search invoice #, quote ref, notes…",
} as const;
