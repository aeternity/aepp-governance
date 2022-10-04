import settings from './settings';
import registryInterface from '../assets/contracts/RegistryInterface.aes';
import byteCodeHashes from '../../../governance-contracts/generated/bytecode_hashes.json';
import {sdk, wallet} from "@/utils/wallet";
import crypto from "crypto";

const contract = {
  registry: null
};

// TODO adjust ACI usage

contract.init = async () => {
  contract.registry = await sdk.getContractInstance({
    source: registryInterface,
    contractAddress: settings[wallet.networkId].contractAddress
  })
}

contract.delegation = async (address) => {
  return (await contract.registry.methods.delegatee(address)).decodedResult;
};

contract.delegations = async (address) => {
  const delegationsResult = await contract.registry.methods.delegators(address);
  return Promise.all(Array.from(delegationsResult.decodedResult.entries()).map(async ([delegator, delegatee]) => {
    const delegateeDelegations = (await contract.registry.methods.delegators(delegator)).decodedResult;
    return {
      delegator: delegator,
      delegatee: delegatee,
      delegatorAmount: await sdk.getBalance(delegator),
      includesIndirectDelegations: delegateeDelegations.size !== 0,
    };
  }));
};

contract.polls = async () => {
  const polls = await contract.registry.methods.polls();
  return Array.from(polls.decodedResult.entries());
};

contract.verifyPollContract = async (pollAddress) => {
  const verifiedHashes = Object.values(byteCodeHashes).map(hashes => hashes["Poll.aes"]?.hash || hashes["Poll_Iris.aes"]?.hash).filter(hash => !!hash)
  //const contractCreateBytecode = await this.client.getContractByteCode(pollAddress).then(res => res.bytecode); can't be used as the returned bytecode is stripped from the init function and thus won't match the pre-generated hash
  const contractCreateBytecode = await fetch(`${settings[wallet.networkId].middlewareUrl}/v2/txs?contract=${pollAddress}&type=contract_create`).then(async res => res.json().then(json => json.data[0]?.tx.code));

  if (contractCreateBytecode) {
    const pollBytecodeHash = crypto.createHash('sha256').update(contractCreateBytecode).digest('hex')
    return verifiedHashes.includes(pollBytecodeHash)
  }
  return false
};

export default contract;
