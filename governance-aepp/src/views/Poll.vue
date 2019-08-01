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
      Author:
      <router-link :to="`/account/${pollState.author}`">{{pollState.author}}</router-link>
      <br/>
      Stake: {{pollVotesState.totalStakeAE}} AE
      <br/>
      Percentage of total supply: {{pollVotesState.percentOfTotalSupply}}%
      <br/>
      <br/>
      <div v-if="delegateeVoteOption != null">includes vote by
        <router-link :to="`/account/${accountAddress}`"> (sub-)delegatee</router-link>
        <br/>
        <span class="text-xs">vote to overwrite, revokation of delegation possible in account</span>
      </div>
      <div class="vote-container" v-for="[id, title] in pollState.vote_options">
        <ae-check class="vote-check" v-model="voteOption" :value="id" type="radio" @change="vote()"></ae-check>

        <div class="vote-bar-container" v-if="pollVotesState.stakesForOption">
          <ae-toolbar :fill="delegateeVoteOption===id || voteOption===id ? 'custom' : ''" class="vote-bar"
                      :style="{'width': `${pollVotesState.stakesForOption[id].percentageOfTotal}%`}">{{title}}
            ({{pollVotesState.stakesForOption[id].percentageOfTotal}}%)
          </ae-toolbar>
        </div>
        <div class="vote-bar-container" v-else>
          {{title}}
        </div>
      </div>
    </div>
    <ae-button face="round" extend @click="revokeVote()" v-if="voteOption!=null">Revoke Vote</ae-button>
  </div>
</template>

<script>
    import aeternity from "~/utils/aeternity";
    import {AeIcon, AeCheck, AeButton, AeToolbar} from '@aeternity/aepp-components/'
    import pollContractSource from '../../../governance-contracts/contracts/Poll.aes'
    import axios from 'axios'
    import BlockchainUtil from "~/utils/util";
    import BiggerLoader from '../components/BiggerLoader'

    export default {
        name: 'Home',
        components: {AeIcon, AeCheck, AeButton, AeToolbar, BiggerLoader},
        data() {
            return {
                accountAddress: null,
                showLoading: true,
                pollId: null,
                delegateeVoteOption: null,
                voteOption: null,
                pollContract: null,
                pollState: {},
                pollVotesState: {}
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
            async loadData() {
                this.pollId = this.$route.params.id;
                this.accountAddress = aeternity.address;

                const pollsOverview = await aeternity.contract.methods.polls_overview();
                const pollOverviewData = pollsOverview.decodedResult.find(([id, _]) => id == this.pollId)[1];
                const pollAddress = pollOverviewData.address.replace('ak_', 'ct_');
                this.pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: pollAddress});

                this.pollState = (await this.pollContract.methods.get_state()).decodedResult;

                // TODO correctly discover if voting power has been delegated
                const accountVote = this.pollState.votes.find(([voter, _]) => voter === this.accountAddress);
                this.voteOption = accountVote ? accountVote[1] : null;

                const votesState = await axios.get(`http://localhost:3000/votesState/${pollAddress}`).then(res => res.data);
                this.pollVotesState = {...votesState, ...{totalStakeAE: BlockchainUtil.atomsToAe(votesState.totalStake).toFixed(2)}};

                const delegationIncludesAccount = this.pollVotesState.stakesForOption.find(data => data.votes.some(vote => vote.delegators.some(delegation => delegation.delegator === this.accountAddress)));
                this.delegateeVoteOption = delegationIncludesAccount ? parseInt(delegationIncludesAccount.option) : null;

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
    margin: 10px 0;
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
</style>
