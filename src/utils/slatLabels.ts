interface SlatTierLike {
  label: string;
  positions: number[];
}

export interface SlatProductLike {
  tiers: SlatTierLike[];
}

const tierSpan = (tier: SlatTierLike): number =>
  Math.max(tier.positions.length, tier.label.length);

export function deriveSlatLabels(
  length: number,
  products?: SlatProductLike[] | null,
): string[] {
  const labels = new Array<string>(length).fill('');

  const productList = Array.isArray(products) ? products : [];
  let longest: SlatTierLike | null = null;
  for (const product of productList) {
    for (const tier of product.tiers) {
      if (!longest || tierSpan(tier) > tierSpan(longest)) longest = tier;
    }
  }

  if (longest) {
    const span = tierSpan(longest);
    for (let k = 0; k < span; k++) {
      const index = longest.positions[k] ?? k;
      const labelChar = longest.label[k];
      if (index >= 0 && index < length) {
        labels[index] = labelChar ? labelChar : '';
      }
    }
  }

  const used = new Set(labels.filter((label) => label));
  let next = 65;
  for (let i = 0; i < length; i++) {
    if (labels[i]) continue;
    while (used.has(String.fromCharCode(next))) next++;
    labels[i] = String.fromCharCode(next);
    used.add(labels[i]);
    next++;
  }

  return labels;
}
