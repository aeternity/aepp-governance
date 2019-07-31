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

      <div class="vote-container" v-for="[id, title] in pollState.vote_options">
        <ae-check class="vote-check" v-model="voteOption" :value="id" type="radio" @change="vote()"></ae-check>

        <div class="vote-bar-container" v-if="pollVotesState.stakesForOption">
          <ae-toolbar :fill="delegateeVoteOption==id ? 'custom' : ''" class="vote-bar"
                      :style="{'width': `${pollVotesState.stakesForOption[id].percentageOfTotal}%`}">{{title}}
            ({{pollVotesState.stakesForOption[id].percentageOfTotal}}%)
          </ae-toolbar>
        </div>
        <div class="vote-bar-container" v-else>
          {{title}}
        </div>
      </div>
      <span v-if="delegatorHasVoted">(delegatee voted for account)</span>
    </div>
  </div>
</template>

<script>
    import aeternity from "~/utils/aeternity";
    import {AeIcon, AeCheck, AeToolbar} from '@aeternity/aepp-components/'
    import pollContractSource from '../../../governance-contracts/contracts/Poll.aes'
    import axios from 'axios'
    import BlockchainUtil from "~/utils/util";
    import BiggerLoader from '../components/BiggerLoader'

    export default {
        name: 'Home',
        components: {AeIcon, AeCheck, AeToolbar, BiggerLoader},
        data() {
            return {
                showLoading: true,
                pollId: null,
                delegateeVoteOption: null,
                voteOption: null,
                pollContract: null,
                hasVotedOrDelegated: {},
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
            async loadData() {
                //TODO correctly discover if voting power has been delegated

                this.pollId = this.$route.params.id;

                this.hasVotedOrDelegated = (await aeternity.contract.methods.has_voted_or_delegated(aeternity.address, this.pollId)).decodedResult;
                this.delegatorHasVoted = !this.hasVotedOrDelegated.has_voted && this.hasVotedOrDelegated.has_delegated && this.hasVotedOrDelegated.voter_or_delegatee_vote_option !== undefined;
                this.delegateeVoteOption = this.hasVotedOrDelegated.voter_or_delegatee_vote_option;
                this.voteOption = this.delegatorHasVoted ? null : this.hasVotedOrDelegated.voter_or_delegatee_vote_option;

                const pollsOverview = await aeternity.contract.methods.polls_overview();
                const pollOverviewData = pollsOverview.decodedResult.find(([id, _]) => id == this.pollId)[1];
                const pollAddress = pollOverviewData.address.replace('ak_', 'ct_');
                this.pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: pollAddress});

                this.pollState = (await this.pollContract.methods.get_state()).decodedResult;

                const votesState = await axios.get(`http://localhost:3000/votesState/${pollAddress}`).then(res => res.data);
                this.pollVotesState = {...votesState, ...{totalStakeAE: BlockchainUtil.atomsToAe(votesState.totalStake).toFixed(2)}};
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
