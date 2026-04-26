import { MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const handleChange = (event: SelectChangeEvent) => {
    void i18n.changeLanguage(event.target.value);
  };

  return (
    <Select
      size="small"
      value={i18n.language.startsWith("es") ? "es" : "en"}
      onChange={handleChange}
      aria-label={t("common.language")}
      sx={{
        minWidth: 116,
        color: "white",
        borderRadius: "999px",
        backgroundColor: "rgba(255,255,255,0.08)",
        ".MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(255,255,255,0.25)",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(255,255,255,0.45)",
        },
        ".MuiSvgIcon-root": {
          color: "white",
        },
      }}
    >
      <MenuItem value="en">{t("common.english")}</MenuItem>
      <MenuItem value="es">{t("common.spanish")}</MenuItem>
    </Select>
  );
}