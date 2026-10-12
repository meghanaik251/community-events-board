export const formatPrice = (paise: number) =>
  paise === 0
    ? "Free"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
      }).format(paise / 100);
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  })
    .format(new Date(iso))
    .replace(/\bam\b/, "AM")
    .replace(/\bpm\b/, "PM");
export const dateParts = (iso: string) => ({
  day: new Intl.DateTimeFormat("en-IN", { day: "2-digit", timeZone: "Asia/Kolkata" }).format(
    new Date(iso),
  ),
  month: new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "Asia/Kolkata" }).format(
    new Date(iso),
  ),
});
