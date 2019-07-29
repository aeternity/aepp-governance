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
        <ae-check v-model="voteOption" @value="id" type="radio">
          {{title}}
        </ae-check>
      </div>
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
                pollState: {}
            }
        },
        computed: {},
        methods: {},
        async mounted() {
            this.pollId = this.$route.params.id;

            const pollsOverview = await aeternity.contract.methods.polls_overview();
            const pollOverviewData = pollsOverview.decodedResult.find(([id, _]) => id == this.pollId)[1];
            const pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: pollOverviewData.address.replace('ak_', 'ct_')});

            this.pollState = (await pollContract.methods.get_state()).decodedResult;
            console.log(this.pollState)
        }
    }
</script>

<style scoped>

</style>
