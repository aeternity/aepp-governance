import BlockchainUtil from "~/utils/util";

export function toAE(num) {
  if (num) {
    return BlockchainUtil.atomsToAe(num).toFixed(2) + " AE";
  } else {
    return "";
  }
}

export function formatPercent(num) {
  if (num) {
    return Number(num).toFixed(0) + "%";
  } else {
    return "";
  }
}
