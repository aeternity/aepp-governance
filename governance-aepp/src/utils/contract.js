import settings from './settings';
import registryInterface from '../assets/contracts/RegistryInterface.aes';
import pollContractSource from '../assets/contracts/Poll.aes';
import pollIrisContractSource from '../assets/contracts/Poll_Iris.aes';
import {toRefs} from "vue";
import {sdk, wallet} from "@/utils/wallet";

const contract = {
  registry: null
};

// TODO adjust ACI usage

contract.init = async () => {
  if (!contract.registry) {
    const {networkId} = toRefs(wallet)

    contract.registry = await sdk.getContractInstance({
      source: registryInterface,
      contractAddress: settings[networkId.value].contractAddress
    })
  }
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
      includesIndirectDelegations: delegateeDelegations.length !== 0,
    };
  }));
};

contract.polls = async () => {
  await contract.init();
  const polls = await contract.registry.methods.polls();
  return Array.from(polls.decodedResult.entries());
};

contract.verifyPollContract = async (pollAddress) => {
  const {networkId} = toRefs(wallet)
  const contractCreateBytecode = fetch(`${settings[networkId.value].middlewareUrl}/v2/txs?contract=${pollAddress}&type=contract_create`).then(async res => {
    res = await res.json();
    if (res.data.length !== 1) return null;
    const contractCreateTx = res.data[0];
    return contractCreateTx ? contractCreateTx.tx.code : null;
  });

  const testCompilers = async (compilers, source) => {
    return Promise.all(compilers.map(async compiler => {
      const compilerBytecode = await fetch(`${compiler.url}/compile`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          code: source,
          options: {'backend': 'fate'},
        }),
      }).then(async res => (await res.json()).bytecode);

      return {
        bytecode: compilerBytecode,
        matches: compilerBytecode === (await contractCreateBytecode),
        version: compiler.version,
      };
    }));
  }

  const compilers4Result = await testCompilers(settings.compilers.filter(c => c.pragma === 4), pollContractSource)
  const compilers5Result = await testCompilers(settings.compilers.filter(c => c.pragma === 5), pollIrisContractSource)
  const compilers6Result = await testCompilers(settings.compilers.filter(c => c.pragma === 6), pollIrisContractSource)
  const compilers7Result = await testCompilers(settings.compilers.filter(c => c.pragma === 7), pollIrisContractSource)

  return compilers4Result
    .concat(compilers5Result)
    .concat(compilers6Result)
    .concat(compilers7Result)
    .find(test => test.matches);
};

export default contract;
