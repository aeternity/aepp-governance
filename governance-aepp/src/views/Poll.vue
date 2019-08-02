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
          :currency="''"
          :address="pollState.author"
        />
      </div>
      Stake: {{pollVotesState.totalStakeAE}} AE ({{pollVotesState.percentOfTotalSupply}}%)

      <div class="flex flex-col mx-4 mt-4" v-if="accountAddress && totalStake">
        <div class="bg-white rounded-lg p-4 shadow">
          <div>
            <div class="label mb-2">
              Voter Account
            </div>
            <ae-identity-light
              :collapsed="true"
              :balance="balance.toFixed(2)"
              :address="accountAddress"
              :active="true"
            />
            <hr class="border-t border-gray-200"/>
            <div class="label mb-2">
              est. delegated stake {{delegateStake}} AE
            </div>
            est. voting stake {{totalStake}} AE
          </div>
        </div>
      </div>

      <br/>

      <div v-if="delegateeVoteOption != null">includes vote by
        <router-link :to="`/account/${accountAddress}`"> (sub-)delegatee</router-link>
        <br/>
        <span class="text-xs">vote to overwrite, revokation of delegation possible in account</span>
      </div>
      <div v-for="[id, title] in pollState.vote_options">
        <div class="vote-container">
          <ae-check class="vote-check" v-model="voteOption" :value="id" type="radio" @change="vote()"></ae-check>
          <div class="vote-bar-container" v-if="pollVotesState.stakesForOption">
            <ae-toolbar :fill="delegateeVoteOption===id || voteOption===id ? 'custom' : ''" class="vote-bar"
                        :style="{'width': `${pollVotesState.stakesForOption[id].percentageOfTotal}%`}">
              {{title}}
            </ae-toolbar>
          </div>
          <div class="vote-bar-container" v-else>
            {{title}}
          </div>
        </div>
        <div class="vote-detail">
          {{pollVotesState.stakesForOption[id].percentageOfTotal}}%
          ({{pollVotesState.stakesForOption[id].optionStakeAE}} AE) -
          <a @click="showVoters(id)">{{pollVotesState.stakesForOption[id].votesCount}} Votes</a> -
          {{pollVotesState.stakesForOption[id].delegatorsCount}} Delegators
        </div>
        <div class="vote-detail" v-if="votersForOption.id != null && votersForOption.id == id">
          <div v-for="voter in votersForOption.voters">
            <ae-identity-light
              :collapsed="true"
              :balance="voter.delegatorsStakeText"
              :currency="''"
              :address="voter.account"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="voteOption!=null">
      <br/>
      <ae-button face="round" extend @click="revokeVote()">Revoke Vote</ae-button>
    </div>
  </div>
</template>

<script>
    import aeternity from "~/utils/aeternity";
    import {AeButton, AeCheck, AeIcon, AeToolbar} from '@aeternity/aepp-components/'
    import pollContractSource from '../../../governance-contracts/contracts/Poll.aes'
    import axios from 'axios'
    import BlockchainUtil from "~/utils/util";
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
                delegateStake: null,
                totalStake: null,
                showLoading: true,
                pollId: null,
                delegateeVoteOption: null,
                voteOption: null,
                pollContract: null,
                pollState: {},
                pollVotesState: {},
                votersForOption: {}
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
                    const stakeAE = BlockchainUtil.atomsToAe(vote.stake).toFixed(2);
                    return {
                        account: vote.account,
                        stake: vote.stake,
                        stakeAE: stakeAE,
                        delegatorsCount: vote.delegators.length,
                        delegatorsStakeText: `${vote.delegators.length ? vote.delegators.length + " Delegators - " : ""} ${stakeAE} AE`
                    };
                });

                this.votersForOption = {
                    id: id,
                    voters: votesAggregation.sort((a, b) => new BigNumber(b.stake).comparedTo(new BigNumber(a.stake)))
                };
            },
            async loadData() {
                //TODO show current account info

                this.pollId = this.$route.params.id;
                this.accountAddress = aeternity.address;
                this.votersForOption = {};

                const balance = await aeternity.client.balance(aeternity.address);
                this.balance = BlockchainUtil.atomsToAe(balance);

                const pollsOverview = await aeternity.contract.methods.polls_overview();
                const pollOverviewData = pollsOverview.decodedResult.find(([id, _]) => id == this.pollId)[1];
                const pollAddress = pollOverviewData.address.replace('ak_', 'ct_');
                this.pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: pollAddress});

                this.pollState = (await this.pollContract.methods.get_state()).decodedResult;

                const accountVote = this.pollState.votes.find(([voter, _]) => voter === this.accountAddress);
                this.voteOption = accountVote ? accountVote[1] : null;

                const votesState = await axios.get(`http://localhost:3000/votesState/${pollAddress}`).then(res => res.data);
                const appendVotesState = {
                    ...votesState, ...{
                        stakesForOption: votesState.stakesForOption.map(option => {
                            option.votesCount = option.votes.length;
                            option.delegatorsCount = option.votes.reduce((acc, vote) => acc + vote.delegators.length, 0);
                            option.optionStakeAE = BlockchainUtil.atomsToAe(option.optionStake).toFixed(2);
                            return option
                        })
                    }
                };
                this.pollVotesState = {...appendVotesState, ...{totalStakeAE: BlockchainUtil.atomsToAe(votesState.totalStake).toFixed(2)}};

                const delegationIncludesAccount = this.pollVotesState.stakesForOption.find(data => data.votes.some(vote => vote.delegators.some(delegation => delegation.delegator === this.accountAddress)));
                this.delegateeVoteOption = delegationIncludesAccount ? parseInt(delegationIncludesAccount.option) : null;

                const delegatedPower = await axios.get(`http://localhost:3000/delegatedPower/${this.accountAddress}`).then(res => res.data);
                this.delegateStake = BlockchainUtil.atomsToAe(delegatedPower.delegatedPower).toFixed(2);
                this.totalStake = BlockchainUtil.atomsToAe(new BigNumber(balance).plus(delegatedPower.delegatedPower)).toFixed(2);

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

  .vote-detail {
    color: #4f4f4f;
    font-size: 0.8rem;
  }

  .author {
    display: flex;
  }
</style>
