/** Production and local API testing must never activate demo fixtures. */
const source = process.env.NEXT_PUBLIC_PUBLIC_DATA_SOURCE;
if (source !== undefined && source !== "api") throw new Error("Invalid public data source. Use api.");
export const publicMockMode = false;
