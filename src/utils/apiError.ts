interface ApiErrorShape {
  message?: string;
  response?: { data?: { msg?: string; message?: string } };
}

interface FormValidationErrorShape {
  errorFields?: unknown;
}

export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiErrorShape;
  const responseMsg = e.response?.data?.msg ?? e.response?.data?.message;
  if (responseMsg) return responseMsg;
  if (e.message) return e.message;
  return fallback;
};

export const isFormValidationError = (err: unknown): boolean =>
  Boolean((err as FormValidationErrorShape)?.errorFields);
