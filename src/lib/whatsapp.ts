/** Build a WhatsApp chat URL from a phone number (any format). */
export function whatsappChatUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}
