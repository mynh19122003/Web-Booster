const fallbackZones = ["Asia/Ho_Chi_Minh", "Asia/Bangkok"];

export const employeeTimeZones = Object.entries(
  [...new Set([
    ...fallbackZones,
    ...(typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []),
  ])]
    .sort((a, b) => a.localeCompare(b))
    .reduce<Record<string, string[]>>((groups, zone) => {
      const region = zone.split("/")[0];
      (groups[region] ??= []).push(zone);
      return groups;
    }, {}),
).map(([region, zones]) => ({ region, zones }));

export function isEmployeeTimeZone(value: string): boolean {
  if (!value || value.length > 100 || !/^[A-Za-z0-9_+\/-]+$/.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
