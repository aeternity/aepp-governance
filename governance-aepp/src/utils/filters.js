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

export function dateToString(timestamp) {
  if (timestamp) {
    const date = new Date(timestamp);
    return `~${date.getHours()}:${String("0" + date.getMinutes()).slice(-2)} ${date.get} on ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  } else
    return '';
}
