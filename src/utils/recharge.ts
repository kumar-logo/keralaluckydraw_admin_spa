interface RechargeResolveInput {
  gatewayMode?: string;
  additionalVerification?: number;
  manualFallback?: number;
}

export const canResolveRecharge = (
  r: RechargeResolveInput,
  isPending: boolean,
): boolean =>
  isPending &&
  (r.gatewayMode !== 'auto' ||
    r.additionalVerification === 1 ||
    r.manualFallback === 1);
