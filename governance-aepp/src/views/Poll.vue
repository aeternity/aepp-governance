<template>
  <div>
    <div class="overlay-loader" v-show="showLoading && !error">
      <BiggerLoader/>
    </div>
    <div v-if="pollState.metadata">
      <AccountHeader class="mb-4" :address="accountAddress" :poll-address="pollAddress"
                     v-if="accountAddress && !isClosed" :startOpen="false" :canOpen="true"/>
      <div class="poll-heading">
        <h1>
          <span>Poll</span>
          <img src="../assets/hash.svg" alt="hash"/>
          <span>{{pollId}}</span>
          <span v-if="isClosed">Closed</span>
        </h1>
      </div>
      <div class="poll-data">
        <h1 class="title">{{pollState.metadata.title}}</h1>
        <div class="description" id="poll-description">
          {{pollState.metadata.description}}
        </div>
        <div class="link">
          <img src="../assets/externalLink.svg" alt="externalLink"/>
          <a :href="pollState.metadata.link" class="text-ellipsis" @click.stop.prevent="openLink">{{pollState.metadata.link}}</a>
          <transition name="fade">
            <div class="copy-msg inset-0" v-if="showCopyNotice">
              Copied link to clipboard
            </div>
          </transition>
        </div>
        <div class="poll-author" id="poll-author">
          <span>BY:</span>
          <div class="text-primary">
            <ae-identity-light
              :collapsed="true"
              balance=""
              :address="pollState.author"
              @click="$router.push(`/account/${pollState.author}`)"
            />
          </div>
        </div>
      </div>
      <div class="poll-metadata">
        <div class="inline-block" v-if="pollVotesState && pollVotesState.totalStake">
          Stake: 
          <span class="ae-value">{{pollVotesState.totalStake | toAE(0, true)}}</span>
          <span class="ae-text">AE</span> ({{pollVotesState.percentOfTotalSupply | formatPercent(2)}})
        </div>
        <div v-if="typeof pollState.close_height !== 'number'" class="inline-block">
          - Closes never
        </div>
        <div v-else-if="!isClosed">
          Closes in <span class="highlited">~{{timeDifference | timeDifferenceToString}}</span> (Block {{pollState.close_height}})
        </div>
        <div v-else-if="isClosed && closeBlock">
          Closed on {{closeBlock.keyBlock.time | timeStampToString}} (Block {{pollState.close_height}})
        </div>
        <div v-else-if="isClosed && !closeBlock">
          Closed at block {{pollState.close_height}}
        </div>
      </div>

      <!-- POLL OPTIONS -->
      <div id="poll-options" class="poll-options">
        <div v-if="pollState.vote_options">
          <div :key="id" v-for="[id, title] in pollState.vote_options">
            <HintBubble v-if="delegateeVote && delegateeVote.option === id">
              Your <span v-if="!Object.keys(delegateeVote.delegationTree).includes(accountAddress)">sub-</span>delegatee
              <a class="font-mono text-primary text-xs" href="#"
                 @click.stop.prevent="$router.push(`/account/${delegateeVote.account}`)">
                {{delegateeVote.account.substr(0,12)}} •••
              </a>
              <span v-if="!isClosed">has</span>
              <span v-if="isClosed">had</span>
              voted with your stake for "{{title}}"<span v-if="isClosed"> at the time the poll closed</span>. <span
              v-if="!isClosed">Unhappy? You can overwrite their choice by placing your own vote.</span>
            </HintBubble>
            <div class="m-4 ae-card cursor-pointer" @click="showVoters(id)">
              <div class="flex justify-between items-center w-full py-4 px-3">
                <ae-check class="mr-1" v-model="voteOption" :value="id" type="radio" @click.stop.prevent
                          @change="vote(id)" :disabled="isClosed || !accountAddress"/>
                <!-- TODO find better solution than this -->
                <div class="mr-auto ml-2" style="margin-top: 4px">
              <span
                class="font-bold" v-if="pollVotesState">{{pollVotesState.stakesForOption[id].percentageOfTotal | formatPercent}}</span>
                  <span>{{title}}</span>
                </div>
                <div class="min-w-3" style="margin-top: 4px" v-if="pollVotesState">
                  <img src="../assets/back_gray.svg" class="ae-transition-300" alt="show poll state"
                       :class="{'rotate-90': votersForOption.id != null && votersForOption.id === id}">
                </div>
              </div>
              <div class="h-1 bg-primary rounded-bl" v-if="pollVotesState"
                   :class="{'rounded-br': pollVotesState.stakesForOption[id].percentageOfTotal > 99}"
                   :style="{'width': `${pollVotesState.stakesForOption[id].percentageOfTotal}%`}">
              </div>
            </div>
            <div class="text-gray-500 text-sm mx-4" v-show="votersForOption.id != null && votersForOption.id === id">
              <div class="text-gray-500 text-sm my-1 mx-2" v-if="pollVotesState">
                {{pollVotesState.stakesForOption[id].percentageOfTotal | formatPercent(2)}}
                ({{pollVotesState.stakesForOption[id].optionStake | toAE}}) -
                {{pollVotesState.stakesForOption[id].votes.length}} Votes -
                {{pollVotesState.stakesForOption[id].delegatorsCount}} Delegators
              </div>
              <AccountTreeLine :balance="voter.stake" :account="voter.account" :delegators="voter.delegators"
                               v-for="voter in votersForOption.voters" :no-sum="true"
                               :key="voter.account"/>
            </div>
          </div>
        </div>
        <div class="footer clearfix">
          <div class="float-left">
            Open source at
            <a href="https://github.com/aeternity/aepp-governance/"
              @click.stop.prevent="openLink('verify', 'https://github.com/aeternity/aepp-governance/')"
              class="highlited">aeternity/aepp-governance</a>
          </div>
          <div class="float-right verify-result">
            <a class="highlited" href="https://github.com/aeternity/aepp-governance/blob/master/docs/how-to-verify-results.md"
              @click.stop.prevent="openLink('verify', 'https://github.com/aeternity/aepp-governance/blob/master/docs/how-to-verify-results.md')"
              v-if="!showCopyNoticeVerify">Verify Poll Result</a>
            <transition name="fade">
              <div class="inset-0 absolute text-white h-8 p-2" v-if="showCopyNoticeVerify">
                copied link to clipboard
              </div>
            </transition>
          </div>
        </div>
      </div>

      <BottomButtons htmlId="poll-nav-buttons" :cta-text="voteOption !== null && !isClosed ?  'Revoke Vote' : null "
                     @cta="revokeVote"/>
    </div>

    <CriticalErrorOverlay :error="error" @continue="continueFunction"/>
  </div>
</template>

<script>

  import "@aeternity/aepp-components/dist/ae-check/ae-check.css"
  import AeCheck from "@aeternity/aepp-components/dist/ae-check/"

  import aeternity from "../utils/aeternity";
  import pollContractSource from '../assets/contracts/PollInterface.aes';
  import Backend from "../utils/backend";
  import BiggerLoader from '../components/BiggerLoader';
  import AeIdentityLight from '../components/AeIdentityLight';
  import BigNumber from 'bignumber.js';
  import BottomButtons from "../components/BottomButtons";
  import AccountHeader from "../components/AccountHeader";
  import CriticalErrorOverlay from "../components/CriticalErrorOverlay";
  import AccountTreeLine from "../components/AccountTreeLine";
  import copy from 'copy-to-clipboard';
  import HintBubble from "../components/HintBubble";

  export default {
    name: 'Home',
    components: {
      HintBubble,
      AccountTreeLine,
      CriticalErrorOverlay,
      AccountHeader, BottomButtons, AeCheck, BiggerLoader, AeIdentityLight
    },
    data() {
      return {
        accountAddress: null,
        balance: null,
        showLoading: true,
        pollId: null,
        delegateeVote: {},
        voteOption: null,
        pollContract: null,
        pollState: {},
        pollVotesState: null,
        pollAddress: null,
        votersForOption: {},
        error: null,
        isClosed: false,
        closeBlock: null,
        showCopyNotice: false,
        showCopyNoticeVerify: false,
        continueFunction: () => {
          this.error = null
        }
      };
    },
    computed: {
      timeDifference() {
        return (this.pollState.close_height - aeternity.height) * 3 * 60 * 1000;
      }
    },
    methods: {
      openLink(mode, url) {
        var target = url ? url : this.pollState.metadata.link;

        if (window.parent === window) {
          // No Iframe
          window.open(target);
        } else {
          copy(target);
          if (mode === 'verify') {
            this.showCopyNoticeVerify = true;
          } else {
            this.showCopyNotice = true;
          }
          setTimeout(() => {
            if (mode === 'verify') {
              this.showCopyNoticeVerify = false;
            } else {
              this.showCopyNotice = false;
            }
          }, 1500)
        }
      },
      async vote(id) {
        this.showLoading = true;
        this.voteOption = id;
        try {
          await this.pollContract.methods.vote(this.voteOption);
        } catch (e) {
          console.error(e);
          this.error = 'Could not process your vote. Please try again.';
        }

        try {
          await this.loadData();
        } catch (e) {
          console.error(e);
          this.showLoading = false;
          this.error = 'Could not process your vote. Please try again.';
        }
      },
      async revokeVote() {
        this.showLoading = true;
        try {
          await this.pollContract.methods.revoke_vote();
          await this.loadData();
        } catch (e) {
          console.error(e);
          this.showLoading = false;
          this.error = 'Could not revoke your vote. Please try again.';
        }
      },
      showVoters(id) {
        if (this.votersForOption.id != null && this.votersForOption.id === id) {
          this.votersForOption = {};
          return;
        }

        if (!this.pollVotesState) return;

        const votes = this.pollVotesState.stakesForOption.find(option => option.option === id.toString()).votes;
        const votesAggregation = votes.map(vote => {
          return {
            account: vote.account,
            stake: vote.stake,
            delegators: vote.delegationTree
          };
        });

        this.votersForOption = {
          id: id,
          voters: votesAggregation.sort((a, b) => new BigNumber(b.stake).comparedTo(new BigNumber(a.stake)))
        };
      },
      async loadData() {
        this.pollId = this.$route.params.id;

        this.votersForOption = {};
        var fetchBalance = Promise.resolve();
        if (!aeternity.passive) {
          this.accountAddress = aeternity.address;
          fetchBalance = aeternity.client.balance(this.address).catch(() => '0').then(balance => {
            this.balance = balance
          });
        }

        const fetchPollAddress = aeternity.contract.methods.poll(this.pollId).then(poll => {
          this.pollAddress = poll.decodedResult.poll;
          return this.pollAddress;
        }).catch(e => {
          console.error(e);
          this.error = 'Could not fetch poll address.';
          this.continueFunction = () => this.$router.push('/');
        });

        const fetchPollState = (async () => {
          this.pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: await fetchPollAddress});
          this.pollState = (await this.pollContract.methods.get_state()).decodedResult;
          this.isClosed = this.pollState.close_height <= parseInt(await aeternity.client.height());
          try {
            this.closeBlock = this.isClosed ? await aeternity.client.getGeneration(this.pollState.close_height) : null;
          } catch (e) {
            // The base-aepp SDK does not support this function yet
          }
          const accountVote = this.pollState.votes.find(([voter, _]) => voter === this.accountAddress);
          this.voteOption = accountVote ? accountVote[1] : null;
        })().catch(e => {
          console.error(e);
          this.error = 'Could not fetch poll state.';
          this.continueFunction = () => this.$router.push('/');
        });

        const fetchVotesState = new Backend(aeternity.networkId).votesState(await fetchPollAddress).then(votesState => {
          if (votesState === null) return;
          this.pollVotesState = votesState;
          this.delegateeVote = this.pollVotesState.stakesForOption
            .map(data => data.votes.find(vote =>
              vote.delegators.some(delegation =>
                delegation.delegator === this.accountAddress))).find(x => x) || {};
        }).catch(console.error);

        await Promise.all([fetchBalance, fetchPollAddress, fetchPollState, fetchVotesState]);

        aeternity.verifyPollContract(await fetchPollAddress).then(verifiedPoll => {
          if (!verifiedPoll) {
            this.error = 'Could not verify poll contract correctness, proceed with caution.'
            this.continueFunction = () => {this.error = null}
          } else {
            console.log('verified poll contract', verifiedPoll)
          }
        })
        this.showLoading = false;
      }
    },
    async mounted() {
      try {
        await this.loadData();
      } catch (e) {
        console.error(e);
        this.error = 'Could not load poll.';
        this.continueFunction = () => {
          this.$router.push('/')
        };
        this.showLoading = false;
      }
    }
  };
</script>

<style lang="scss" scoped>
  .poll-heading {
    padding: 10px;
    background-color: #272831;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid #12121B;

    img {
      display: inline;
      height: 20px;
      margin: -3px;
    }

    span,
    h1 {
      font-size: 20px;
      font-weight: 400;
      color: #2A9CFF;
      vertical-align: middle;
    }
  }

  .poll-data {
    padding: 10px;

    .title {
      color: #fff;
      font-weight: 600;
      font-size: 18px;
    }

    .description {
      color: #AEAEAE;
      font-size: 15px;
      font-weight: 400;
    }

    .link {
      position: relative;
      display: flex;

      a {
        margin-left: 5px;
        color: #67F7B8;
        font-size: 15px;
        font-weight: 400;
        display: inline-block;
        width: 100%;
      }

      .copy-msg {
        background-color: #21222C;
        color: #fff;
        position: absolute;
      }

      &:hover a{
        text-decoration: underline;
      }
    }
  }

  .title,
  .description,
  .link,
  .poll-author,
  .poll-metadata {
    margin-bottom: 10px;
  }

  .poll-author {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #12121B;
    padding-bottom: 10px;

    & > span {
      color: #727278;
      margin-right: 5px;
      font-size: 15px;
    }
  }

  .poll-metadata {
    color: #727278;
    font-size: 15px;
    font-weight: 400;

    .ae-value {
      color: #fff;
    }

    .ae-text {
      color: #2A9CFF;
    }
  }

  .poll-options {
    background-color: #12121B;
    padding: 20px 10px;
  }

  .footer {
    margin-top: 20px;
    font-size: 11px;
    color: #727278;

    .highlited:hover {
      filter: brightness(1.3)
    }

    .verify-result {
      position: relative;
      min-width: 150px;
      text-align: right;
    }
  }
</style>
