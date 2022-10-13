import settings from "./settings";

const wrapTry = async (f) => {
  try {
    return Promise.race([
      f().then(res => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        return res.json()
      }),
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

  votesState = async (poll) => {
    const votesState = await wrapTry(async () => fetch(`${this.BACKEND_URL}/votesState/${poll}`));
    if (!votesState) return null;
    return {
      ...votesState, ...{
        stakesForOption: votesState.stakesForOption.map(option => {
          option.delegatorsCount = option.votes.reduce((acc, vote) => acc + vote.delegators.length, 0);
          return option
        })
      }
    };
  };

  delegatedPower = (account, poll) => wrapTry(async () => {
    if (poll) return fetch(`${this.BACKEND_URL}/delegatedPower/${account}?poll=${poll}`);
    return fetch(`${this.BACKEND_URL}/delegatedPower/${account}`);
  });

  pollOverview = async (address) => wrapTry(async () => {
    return fetch(`${this.BACKEND_URL}/pollOverview/${address}`);
  });

  accountPollVoterAuthor = async (address) => wrapTry(async () => {
    return fetch(`${this.BACKEND_URL}/accountPollVoterAuthor/${address}`);
  });

  contractEvent = async (topic, poll) => wrapTry(async () => {
    return fetch(`${this.BACKEND_URL}/contractEvent`, {
      body: JSON.stringify({topic: topic, poll: poll}),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  pollOrdering = async (closed = false) => wrapTry(async () => {
    return fetch(`${this.BACKEND_URL}/pollOrdering?closed=${closed ? "true" : "false"}`);
  });

  version = async () => wrapTry(async () => {
    return fetch(`${this.BACKEND_URL}/version`);
  });
}
