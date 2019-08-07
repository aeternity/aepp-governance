<template>
  <div>
    <div class="overlay-loader" v-show="showLoading">
      <BiggerLoader></BiggerLoader>
    </div>
    <div @click="$router.push('/')" class="fixed top-0 right-0 p-8">
      <ae-icon name="close" fill="primary" face="round"
               class="ae-icon-size shadow"></ae-icon>
    </div>

    <h1 class="h1">Poll #{{pollId}}</h1>
    <br/>
    <div v-if="pollState.metadata">
      <h1 class="h1">{{pollState.metadata.title}}</h1>
      {{pollState.metadata.description}}
      <br/>
      Link: <a @href="pollState.metadata.link">{{pollState.metadata.link}}</a>
      <br/>
      <div class="author">
        Author:&nbsp;
        <ae-identity-light
          :collapsed="true"
          :balance="''"
          :address="pollState.author"
        />
      </div>
      <span v-if="totalStake">
        Stake: {{pollVotesState.totalStake | toAE}} ({{pollVotesState.percentOfTotalSupply | formatPercent}})
      </span>

      <div class="flex flex-col mx-2 mt-2 mb-6" v-if="accountAddress">
        <div class="bg-white rounded p-2 shadow">
          <div>
            <div class="label mb-2">
              Voter Account
            </div>
            <ae-identity-light
              :collapsed="true"
              :balance="balance"
              :address="accountAddress"
            />
            <div v-if="totalStake!= null && delegatedPower != null">
              <hr class="border-t border-gray-200"/>
              <div class="label text-xs">est. delegated stake {{delegatedPower | toAE}}</div>
              <div class="label text-xs mb-1">(delegators votes can overwrite delegation)</div>
              <div class="-mb-1">est. voting stake <strong>{{totalStake | toAE}}</strong></div>
            </div>
            <span v-else class="label text-xs">can't load delegation information, may include delegated stake or (sub-)delegatee already voted</span>
          </div>
        </div>
      </div>

      <div v-if="delegateeVote.option != null">includes vote by (sub-)delegatee
        <ae-identity-light
          :collapsed="true"
          :balance="''"
          :address="delegateeVote.account"
        />
        <div class="text-xs">
          vote to overwrite,
          <router-link :to="`/account/${accountAddress}`">or manage delegation</router-link>
        </div>
      </div>
      <div v-for="[id, title] in pollState.vote_options">
        <div class="vote-container">
          <ae-check class="vote-check" v-model="voteOption" :value="id" type="radio" @change="vote()"></ae-check>
          <div class="vote-bar-container" v-if="pollVotesState && pollVotesState.stakesForOption">
            <ae-toolbar :fill="delegateeVote.option===id || voteOption===id ? 'custom' : ''" class="vote-bar"
                        :style="{'width': `${pollVotesState.stakesForOption[id].percentageOfTotal}%`}">
              {{title}}
            </ae-toolbar>
          </div>
          <div class="vote-bar-container" v-else>
            {{title}}
          </div>
        </div>
        <div class="label text-xs my-1" v-if="pollVotesState">
          {{pollVotesState.stakesForOption[id].percentageOfTotal | formatPercent}}
          ({{pollVotesState.stakesForOption[id].optionStake | toAE}}) -
          <a @click="showVoters(id)">{{pollVotesState.stakesForOption[id].votes.length}} Votes</a> -
          {{pollVotesState.stakesForOption[id].delegatorsCount}} Delegators
        </div>
        <div class="label text-xs" v-if="votersForOption.id != null && votersForOption.id == id">
          <div v-for="voter in votersForOption.voters">
            <ae-identity-light
              :collapsed="true"
              :additionalText="voter.delegatorsCount ? voter.delegatorsCount + ' D - ' : ''"
              :balance="voter.stake"
              :address="voter.account"
              class="mx-2"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="voteOption!=null">
      <br/>
      <ae-button face="flat" extend @click="revokeVote()">Revoke Vote</ae-button>
    </div>
  </div>
</template>

<script>
    import aeternity from "~/utils/aeternity";
    import {AeButton, AeCheck, AeIcon, AeToolbar} from '@aeternity/aepp-components/'
    import pollContractSource from '../../../governance-contracts/contracts/Poll.aes'
    import Backend from "~/utils/backend";
    import BiggerLoader from '../components/BiggerLoader';
    import AeIdentityLight from '../components/AeIdentityLight'
    import BigNumber from 'bignumber.js';

    export default {
        name: 'Home',
        components: {AeIcon, AeCheck, AeButton, AeToolbar, BiggerLoader, AeIdentityLight},
        data() {
            return {
                accountAddress: null,
                balance: null,
                totalStake: null,
                showLoading: true,
                pollId: null,
                delegateeVote: {},
                voteOption: null,
                pollContract: null,
                pollState: {},
                pollVotesState: null,
                votersForOption: {},
                delegatedPower: null,
            }
        },
        computed: {},
        methods: {
            async vote() {
                this.showLoading = true;
                await this.pollContract.methods.vote(this.voteOption);
                await this.loadData();
            },
            async revokeVote() {
                this.showLoading = true;
                await this.pollContract.methods.revoke_vote();
                await this.loadData();
            },
            showVoters(id) {
                if (this.votersForOption.id != null && this.votersForOption.id == id) {
                    this.votersForOption = {};
                    return;
                }

                const votes = this.pollVotesState.stakesForOption.find(option => option.option === id.toString()).votes;
                const votesAggregation = votes.map(vote => {
                    return {
                        account: vote.account,
                        stake: vote.stake,
                        delegatorsCount: vote.delegators.length
                    };
                });

                this.votersForOption = {
                    id: id,
                    voters: votesAggregation.sort((a, b) => new BigNumber(b.stake).comparedTo(new BigNumber(a.stake)))
                };
            },
            async loadData() {
                this.pollId = this.$route.params.id;
                this.accountAddress = aeternity.address;
                this.votersForOption = {};

                this.balance = await aeternity.client.balance(aeternity.address);

                const poll = await aeternity.contract.methods.poll(this.pollId);
                const pollAddress = poll.decodedResult.poll;
                this.pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: pollAddress});

                this.pollState = (await this.pollContract.methods.get_state()).decodedResult;

                const accountVote = this.pollState.votes.find(([voter, _]) => voter === this.accountAddress);
                this.voteOption = accountVote ? accountVote[1] : null;

                await Backend.votesState(pollAddress).then((votesState) => {
                    this.pollVotesState = votesState;

                    this.delegateeVote = this.pollVotesState.stakesForOption
                        .map(data => data.votes.find(vote => vote.delegators
                            .some(delegation => delegation.delegator === this.accountAddress))).find(x => x) || {};
                }).catch(console.error);

                await Backend.delegatedPower(this.accountAddress, pollAddress).then(delegatedPower => {
                    this.delegatedPower = delegatedPower.delegatedPower;
                    this.totalStake = new BigNumber(this.balance).plus(this.delegatedPower);
                }).catch(console.error);

                this.showLoading = false;
            }
        },
        async mounted() {
            this.loadData();
        }
    }
</script>

<style scoped>
  .vote-container {
    margin-top: 10px;
    display: flex;
  }

  .vote-bar-container {
    display: flex;
    flex: 1 1;
  }

  .vote-bar {
    width: 100%;
  }

  .ae-toolbar.custom {
    color: black;
    background-color: #FF0D6A;
  }

  .author {
    display: flex;
  }

  .ae-button.flat {
    height: 40px;
  }
</style>
