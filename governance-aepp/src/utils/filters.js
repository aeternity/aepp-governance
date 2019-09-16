import BlockchainUtil from "~/utils/util";

export function toAE(num, decimalPlaces) {
  if (num) {
    if(typeof decimalPlaces === 'undefined') decimalPlaces = 2;
    return BlockchainUtil.atomsToAe(num).toFixed(decimalPlaces) + " AE";
  } else {
    return "";
  }
}

export function formatPercent(num, decimalPlaces) {
  if (num) {
    if(typeof decimalPlaces === 'undefined') decimalPlaces = 0;
    return Number(num).toFixed(decimalPlaces) + "%";
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
