import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export function WhatsAppButton({
  phone,
  compact,
  className,
  onClick,
}: {
  phone: string;
  compact?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const { t } = useTranslation();
  const href = whatsappChatUrl(phone);
  if (!href) return null;

  return (
    <Button
      asChild
      variant="outline"
      size={compact ? "icon" : "sm"}
      className={cn("rounded-xl border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]", className)}
      title={t("clients.openWhatsApp")}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        <MessageCircle className={cn("h-4 w-4", !compact && "mr-1.5")} />
        {!compact && t("clients.openWhatsApp")}
      </a>
    </Button>
  );
}
