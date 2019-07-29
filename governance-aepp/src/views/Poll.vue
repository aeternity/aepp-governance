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
      <br/>

      <div v-for="[id, title] in pollState.vote_options">
        <ae-check v-model="voteOption" :value="id" type="radio" @change="vote()">
          {{title}}
        </ae-check>
      </div>
      <span v-if="delegatorHasVoted">(delegatee voted for account)</span>
    </div>
  </div>
</template>

<script>
    import aeternity from "~/utils/aeternityNetwork";
    import {AeIcon, AeCheck} from '@aeternity/aepp-components/'
    import pollContractSource from '../../../governance-contracts/contracts/Poll.aes'

    export default {
        name: 'Home',
        components: {AeIcon, AeCheck},
        data() {
            return {
                pollId: null,
                voteOption: null,
                pollContract: null,
                hasVotedOrDelegated: {},
                pollState: {}
            }
        },
        computed: {},
        methods: {
            async vote() {
                await this.pollContract.methods.vote(this.voteOption);
            }
        },
        async mounted() {
            this.pollId = this.$route.params.id;

            this.hasVotedOrDelegated = (await aeternity.contract.methods.has_voted_or_delegated(aeternity.address, this.pollId)).decodedResult;
            this.voteOption = this.hasVotedOrDelegated.voter_or_delegatee_vote_option;
            this.delegatorHasVoted = !this.hasVotedOrDelegated.has_voted && this.hasVotedOrDelegated.has_delegated && this.voteOption !== undefined;

            const pollsOverview = await aeternity.contract.methods.polls_overview();
            const pollOverviewData = pollsOverview.decodedResult.find(([id, _]) => id == this.pollId)[1];
            this.pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: pollOverviewData.address.replace('ak_', 'ct_')});

            this.pollState = (await this.pollContract.methods.get_state()).decodedResult;
        }
    }
</script>

<style scoped>

</style>
