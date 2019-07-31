<template>
  <div>
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
          <ae-toolbar :fill="voteOption==id ? 'custom' : ''" class="vote-bar"
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
    import aeternity from "~/utils/aeternityNetwork";
    import {AeIcon, AeCheck, AeToolbar} from '@aeternity/aepp-components/'
    import pollContractSource from '../../../governance-contracts/contracts/Poll.aes'
    import axios from 'axios'
    import BlockchainUtil from "~/utils/blockchainUtil";

    export default {
        name: 'Home',
        components: {AeIcon, AeCheck, AeToolbar},
        data() {
            return {
                pollId: null,
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
                await this.pollContract.methods.vote(this.voteOption);
                await this.loadData();
            },
            async loadData() {
                this.pollId = this.$route.params.id;

                this.hasVotedOrDelegated = (await aeternity.contract.methods.has_voted_or_delegated(aeternity.address, this.pollId)).decodedResult;
                this.voteOption = this.hasVotedOrDelegated.voter_or_delegatee_vote_option;
                this.delegatorHasVoted = !this.hasVotedOrDelegated.has_voted && this.hasVotedOrDelegated.has_delegated && this.voteOption !== undefined;

                const pollsOverview = await aeternity.contract.methods.polls_overview();
                const pollOverviewData = pollsOverview.decodedResult.find(([id, _]) => id == this.pollId)[1];
                const pollAddress = pollOverviewData.address.replace('ak_', 'ct_');
                this.pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: pollAddress});

                this.pollState = (await this.pollContract.methods.get_state()).decodedResult;

                axios.get(`http://localhost:3000/votesState/${pollAddress}`)
                    .then(res => this.pollVotesState = {...res.data, ...{totalStakeAE: BlockchainUtil.atomsToAe(res.data.totalStake).toFixed(2)}});
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
