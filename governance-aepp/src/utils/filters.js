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

export function timeDifferenceToString(timeDifference) {
  if (timeDifference) {
    if(timeDifference < 60 * 1000) return `less than one minute`;
    const minutes = timeDifference / 60 / 1000;
    if(minutes < 60) return `${Math.round(minutes)} minute${minutes > 1 ? 's' : ''}`;

    const hours = minutes / 60;
    if(hours < 24) return `${Math.round(hours)} hour${hours > 1 ? 's' : ''}`;

    const days = hours / 24;
    if(days < 31) return `${Math.round(days)} day${days > 1 ? 's' : ''}`;

    const months = days / 30;
    if(months < 12) return `${Math.round(months)} month${months > 1 ? 's' : ''}`;

    const years = months / 12;
    return `${Math.round(years)} years`;
  } else
    return '';
}

export function timeStampToString(timestamp) {
  if(timestamp) {
    const date = new Date(timestamp);

    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  } else {
    return ''
  }
}
