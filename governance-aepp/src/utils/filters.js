import BlockchainUtil from "~/utils/util";

export function toAE(num) {
  if (num) {
    return BlockchainUtil.atomsToAe(num).toFixed(0) + " AE";
  } else {
    return "";
  }
}
