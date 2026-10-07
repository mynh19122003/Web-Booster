export class ApiFeatureUnavailableError extends Error {
  readonly code = "NOT_IMPLEMENTED";
  constructor(public feature: string) {
    super("Dữ liệu chưa khả dụng.");
    this.name = "ApiFeatureUnavailableError";
  }
}
export function unavailable(feature: string) {
  return async (...args: unknown[]): Promise<never> => {
    void args;
    throw new ApiFeatureUnavailableError(feature);
  };
}
