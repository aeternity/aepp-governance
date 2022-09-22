import settings from './settings';
import pollContractSource from '../assets/contracts/Poll.aes';
import pollIrisContractSource from '../assets/contracts/Poll_Iris.aes';

const contract = {};

// TODO fix sdk connection
// TODO expose initialized registry contract
// TODO adjust ACI usage

contract.delegation = async (address) => {
  return (await aeternity.contract.methods.delegatee(address)).decodedResult;
};

contract.delegations = async (address) => {
  const delegationsResult = await aeternity.contract.methods.delegators(address, tempCallOptions);
  return Promise.all(delegationsResult.decodedResult.map(async ([delegator, delegatee]) => {
    const delegateeDelegations = (await aeternity.contract.methods.delegators(delegator, tempCallOptions)).decodedResult;
    return {
      delegator: delegator,
      delegatee: delegatee,
      delegatorAmount: await aeternity.client.balance(delegator).catch(() => '0'),
      includesIndirectDelegations: delegateeDelegations.length !== 0,
    };
  }));
};

contract.polls = async () => {
  const polls = await aeternity.contract.methods.polls(tempCallOptions);
  return polls.decodedResult;
};


contract.verifyPollContract = async (pollAddress) => {
  const contractCreateBytecode = fetch(`${settings[aeternity.networkId].middlewareUrl}/v2/txs?contract=${pollAddress}&type=contract_create`).then(async res => {
    res = await res.json();
    if (res.data.length !== 1) return null;
    const contractCreateTx = res.data[0];
    return contractCreateTx ? contractCreateTx.tx.code : null;
  });

  const testCompilers = async (compilers, source) => {
    return Promise.all(compilers.map(async compiler => {
      const compilerBytecode = await fetch(`${compiler.url}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: source,
          options: { 'backend': 'fate' },
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
