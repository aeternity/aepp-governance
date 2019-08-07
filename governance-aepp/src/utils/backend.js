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

backend.votesState = async (poll) => wrapTry(async () => {
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
});

backend.delegatedPower = (account, poll) => wrapTry(async () => {
  if (poll) return axios.get(`http://localhost:3000/delegatedPower/${account}?poll=${poll}`).then(res => res.data);
  return axios.get(`http://localhost:3000/delegatedPower/${account}`).then(res => res.data);
});

backend.pollOverview = () => wrapTry(async () => {
  return axios.get(`http://localhost:3000/pollOverview`).then(res => res.data);
});

export default backend;
