import axios from "axios";

const backend = {};

//const BACKEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'https://server.governance.aeternity.art';

const wrapTry = async (f) => {
  try {
    return Promise.race([
      f(),
      new Promise(function (resolve, reject) {
        setTimeout(reject, 8000, 'TIMEOUT');
      })
    ])
  } catch (e) {
    console.error("backend error", e);
    return null;
  }
};

backend.votesState = async (poll) => wrapTry(async () => {
  const votesState = await axios.get(`${BACKEND_URL}/votesState/${poll}`).then(res => res.data);
  const appendVotesState = {
    ...votesState, ...{
      stakesForOption: votesState.stakesForOption.map(option => {
        option.delegatorsCount = option.votes.reduce((acc, vote) => acc + vote.delegators.length, 0);
        return option
      })
    }
  };
  return appendVotesState;
});

backend.delegatedPower = (account, poll) => wrapTry(async () => {
  if (poll) return axios.get(`${BACKEND_URL}/delegatedPower/${account}?poll=${poll}`).then(res => res.data);
  return axios.get(`${BACKEND_URL}/delegatedPower/${account}`).then(res => res.data);
});

backend.pollOverview = async (address) => wrapTry(async () => {
  return axios.get(`${BACKEND_URL}/pollOverview/${address}`).then(res => res.data);
});

backend.accountPollVoterAuthor = async (address) => wrapTry(async () => {
  return axios.get(`${BACKEND_URL}/accountPollVoterAuthor/${address}`).then(res => res.data);
});

backend.contractEvent = async (topic, poll) => wrapTry(async () => {
  return axios.post(`${BACKEND_URL}/contractEvent`, {topic: topic, poll: poll});
});

backend.pollOrdering = async (closed = false) => wrapTry(async () => {
  return axios.get(`${BACKEND_URL}/pollOrdering?closed=${closed ? "true" : "false"}`).then(res => res.data);
});

export default backend;
