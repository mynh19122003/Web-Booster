/** Select explicitly; API errors must never silently switch to demo data. */
const source = process.env.NEXT_PUBLIC_PUBLIC_DATA_SOURCE;
if (source !== undefined && source !== "mock" && source !== "api") throw new Error("Invalid public data source. Use mock or api.");
export const publicMockMode = source !== "api";
