import axios from "axios";

const backend = {};

const BACKEND_URL = 'http://localhost:3000';

const wrapTry = async (f) => {
  try {
    return Promise.race([
      f(),
      new Promise(function (resolve, reject) {
        setTimeout(reject, 5000, 'TIMEOUT');
      })
    ])
  } catch (e) {
    console.error("backend error", e);
    return null;
  }
};

const wrapTimeout = async (f) => {
  let timeoutPromise = new Promise((resolve, reject) => {
    let wait = setTimeout(() => {
      clearTimeout(wait);
      resolve(null);
    }, 5000)
  });

  return Promise.race([f(), timeoutPromise]);
};

backend.votesState = async (poll) => wrapTimeout(async () => wrapTry(async () => {
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
}));

backend.delegatedPower = (account, poll) => wrapTimeout(async () => wrapTry(async () => {
  if (poll) return axios.get(`${BACKEND_URL}/delegatedPower/${account}?poll=${poll}`).then(res => res.data);
  return axios.get(`${BACKEND_URL}/delegatedPower/${account}`).then(res => res.data);
}));

backend.pollOverview = async (address) => wrapTimeout(async () => {
  return axios.get(`${BACKEND_URL}/pollOverview/${address}`).then(res => res.data);
});

backend.accountPollVoterAuthor = async (address) => wrapTimeout(async () => {
  return axios.get(`${BACKEND_URL}/accountPollVoterAuthor/${address}`).then(res => res.data);
});

backend.contractEvent = async (topic, poll) => wrapTimeout(async () => {
  return axios.post(`${BACKEND_URL}/contractEvent`, {topic: topic, poll: poll});
});

backend.pollOrdering = async (closed = false) => wrapTimeout(async () => wrapTry(async () => {
  return axios.get(`${BACKEND_URL}/pollOrdering?closed=${closed ? "true" : "false"}`).then(res => res.data);
}));

export default backend;
