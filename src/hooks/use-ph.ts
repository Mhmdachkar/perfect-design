import { useTranslation } from "react-i18next";

/** Locale-aware input placeholders. */
export function usePh() {
  const { t } = useTranslation();
  return {
    client: {
      fullName: t("placeholders.client.fullName"),
      phone: t("placeholders.client.phone"),
      notes: t("placeholders.client.notes"),
      whatsapp: t("placeholders.client.whatsapp"),
      city: t("placeholders.client.city"),
      email: t("placeholders.client.email"),
      company: t("placeholders.client.company"),
      address: t("placeholders.client.address"),
      search: t("placeholders.client.search"),
    },
    workshop: {
      name: t("placeholders.workshop.name"),
      type: t("placeholders.workshop.type"),
      amount: t("placeholders.workshop.amount"),
      discount: t("placeholders.workshop.discount"),
      description: t("placeholders.workshop.description"),
      search: t("placeholders.workshop.search"),
      selectClient: t("placeholders.workshop.selectClient"),
    },
    expense: {
      name: t("placeholders.expense.name"),
      amount: t("placeholders.expense.amount"),
      vendor: t("placeholders.expense.vendor"),
    },
    payment: {
      amount: t("placeholders.payment.amount"),
      reference: t("placeholders.payment.reference"),
      notes: t("placeholders.payment.notes"),
      selectClient: t("placeholders.payment.selectClient"),
    },
    settings: {
      businessName: t("placeholders.settings.businessName"),
      email: t("placeholders.settings.email"),
      phone: t("placeholders.settings.phone"),
      address: t("placeholders.settings.address"),
      invoiceFooter: t("placeholders.settings.invoiceFooter"),
      logoUrl: t("placeholders.settings.logoUrl"),
      exchangeRate: t("placeholders.settings.exchangeRate"),
    },
    auth: {
      name: t("placeholders.auth.name"),
      email: t("placeholders.auth.email"),
      password: t("placeholders.auth.password"),
    },
    notes: {
      new: t("placeholders.notes.new"),
      edit: t("placeholders.notes.edit"),
    },
    tag: t("placeholders.tag"),
    filter: t("placeholders.filter"),
    paymentsSearch: t("placeholders.paymentsSearch"),
  };
}
