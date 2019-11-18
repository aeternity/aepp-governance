import axios from "axios";
import settings from "./settings";

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

export default class Backend {

  BACKEND_URL;

  constructor(networkId) {
    this.BACKEND_URL = settings[networkId].backendUrl;
  }

  votesState = async (poll) => wrapTry(async () => {
    const votesState = await axios.get(`${this.BACKEND_URL}/votesState/${poll}`).then(res => res.data);
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

  delegatedPower = (account, poll) => wrapTry(async () => {
    if (poll) return axios.get(`${this.BACKEND_URL}/delegatedPower/${account}?poll=${poll}`).then(res => res.data);
    return axios.get(`${this.BACKEND_URL}/delegatedPower/${account}`).then(res => res.data);
  });

  pollOverview = async (address) => wrapTry(async () => {
    return axios.get(`${this.BACKEND_URL}/pollOverview/${address}`).then(res => res.data);
  });

  accountPollVoterAuthor = async (address) => wrapTry(async () => {
    return axios.get(`${this.BACKEND_URL}/accountPollVoterAuthor/${address}`).then(res => res.data);
  });

  contractEvent = async (topic, poll) => wrapTry(async () => {
    return axios.post(`${this.BACKEND_URL}/contractEvent`, {topic: topic, poll: poll});
  });

  pollOrdering = async (closed = false) => wrapTry(async () => {
    return axios.get(`${this.BACKEND_URL}/pollOrdering?closed=${closed ? "true" : "false"}`).then(res => res.data);
  });
}
