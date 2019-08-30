import axios from "axios";

const backend = {};

const wrapTry = async (f) => {
  try {
    return await f()
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
  const votesState = await axios.get(`http://localhost:3000/votesState/${poll}`).then(res => res.data);
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
  if (poll) return axios.get(`http://localhost:3000/delegatedPower/${account}?poll=${poll}`).then(res => res.data);
  return axios.get(`http://localhost:3000/delegatedPower/${account}`).then(res => res.data);
}));

backend.pollOverview = async (address) => wrapTimeout(async () => {
  return axios.get(`http://localhost:3000/pollOverview/${address}`).then(res => res.data);
});

backend.accountPollVoterAuthor = async (address) => wrapTimeout(async () => {
  return axios.get(`http://localhost:3000/accountPollVoterAuthor/${address}`).then(res => res.data);
});

backend.contractEvent = async (topic, poll) => wrapTimeout(async () => {
  return axios.post(`http://localhost:3000/contractEvent`, {topic: topic, poll: poll});
});

export default backend;
