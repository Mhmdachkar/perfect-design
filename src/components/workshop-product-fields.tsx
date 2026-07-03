import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUiStore } from "@/stores/ui-store";
import {
  COVER_OPTIONS,
  FRAME_SIZES,
  PAPER_SIZES,
  PP_MEASUREMENT_PRESETS,
  STICKER_SIZES,
  STICKER_VINYL_SIZES,
  WORKSHOP_PRODUCT_GROUPS,
  findWorkshopProduct,
  type WorkshopProductFormState,
} from "@/lib/workshop-measurements";

type Props = {
  state: WorkshopProductFormState;
  onChange: (patch: Partial<WorkshopProductFormState>) => void;
  onProductSelect?: (productId: string, basePrice?: number, suggestedName?: string) => void;
};

export function WorkshopProductFields({ state, onChange, onProductSelect }: Props) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const group = WORKSHOP_PRODUCT_GROUPS.find((g) => g.id === state.groupId);
  const product = findWorkshopProduct(state.productId);

  function selectGroup(groupId: string) {
    onChange({
      groupId,
      productId: "",
      cover: "",
      measurement: "",
      size: "",
      customMeasurement: "",
      customStickerSize: "",
    });
  }

  function selectProduct(productId: string) {
    const p = findWorkshopProduct(productId);
    onChange({
      productId,
      cover: "",
      measurement: "",
      size: "",
      customMeasurement: "",
      customStickerSize: "",
    });
    if (p && onProductSelect) {
      const label = locale === "ar" ? p.nameAr : p.name;
      onProductSelect(productId, p.basePrice, label);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("workshopProduct.sectionTitle")}
      </p>

      <div className="space-y-1.5">
        <Label>{t("workshopProduct.category")} *</Label>
        <Select value={state.groupId || "none"} onValueChange={(v) => selectGroup(v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder={t("workshopProduct.selectCategory")} /></SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="none">—</SelectItem>
            {WORKSHOP_PRODUCT_GROUPS.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {locale === "ar" ? g.labelAr : g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {group && (
        <div className="space-y-1.5">
          <Label>{t("workshopProduct.product")} *</Label>
          <Select value={state.productId || "none"} onValueChange={(v) => selectProduct(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder={t("workshopProduct.selectProduct")} /></SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="none">—</SelectItem>
              {group.products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {locale === "ar" ? p.nameAr : p.name}
                  {p.basePrice != null ? ` (${p.basePrice} LYD)` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {product?.requiresCover && (
        <div className="space-y-1.5">
          <Label>{t("workshopProduct.cover")} *</Label>
          <Select value={state.cover || "none"} onValueChange={(v) => onChange({ cover: v === "none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder={t("workshopProduct.selectCover")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {COVER_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>{t(`workshopProduct.covers.${c === "With Cover" ? "with" : "without"}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {product?.measurementKind === "pp_preset" && (
        <div className="space-y-1.5">
          <Label>{t("workshopProduct.measurementPreset")} *</Label>
          <Select value={state.measurement || "none"} onValueChange={(v) => onChange({ measurement: v === "none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder={t("workshopProduct.selectMeasurement")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {PP_MEASUREMENT_PRESETS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {product?.measurementKind === "frame_size" && (
        <div className="space-y-1.5">
          <Label>{t("workshopProduct.size")} *</Label>
          <Select value={state.size || "none"} onValueChange={(v) => onChange({ size: v === "none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder={t("workshopProduct.selectSize")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {FRAME_SIZES.map((s) => (
                <SelectItem key={s} value={s}>{s} cm</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {product?.measurementKind === "paper_size" && (
        <div className="space-y-1.5">
          <Label>{t("workshopProduct.size")} *</Label>
          <Select value={state.size || "none"} onValueChange={(v) => onChange({ size: v === "none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder={t("workshopProduct.selectSize")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {PAPER_SIZES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {product?.measurementKind === "sticker_paper" && (
        <div className="space-y-1.5">
          <Label>{t("workshopProduct.size")} *</Label>
          <Select value={state.size || "none"} onValueChange={(v) => onChange({ size: v === "none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder={t("workshopProduct.selectSize")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {STICKER_SIZES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {product?.measurementKind === "sticker_vinyl" && (
        <>
          <div className="space-y-1.5">
            <Label>{t("workshopProduct.size")} *</Label>
            <Select value={state.size || "none"} onValueChange={(v) => onChange({ size: v === "none" ? "" : v, customStickerSize: v === "Custom (cm)" ? state.customStickerSize : "" })}>
              <SelectTrigger><SelectValue placeholder={t("workshopProduct.selectSize")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {STICKER_VINYL_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>{s === "Custom (cm)" ? t("workshopProduct.customSizeOption") : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {state.size === "Custom (cm)" && (
            <div className="space-y-1.5">
              <Label>{t("workshopProduct.customSize")} *</Label>
              <Input
                placeholder={t("workshopProduct.customSizePlaceholder")}
                value={state.customStickerSize}
                onChange={(e) => onChange({ customStickerSize: e.target.value })}
              />
            </div>
          )}
        </>
      )}

      {product?.measurementKind === "free_text" && (
        <div className="space-y-1.5">
          <Label>{t("workshopProduct.customMeasurement")} *</Label>
          <Input
            placeholder={t("workshopProduct.customMeasurementPlaceholder")}
            value={state.customMeasurement}
            onChange={(e) => onChange({ customMeasurement: e.target.value })}
          />
          <p className="text-[11px] text-muted-foreground">{t("workshopProduct.customMeasurementHint")}</p>
        </div>
      )}
    </div>
  );
}
