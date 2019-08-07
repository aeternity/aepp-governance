<template>
  <div>
    <div class="overlay-loader" v-show="showLoading">
      <BiggerLoader></BiggerLoader>
    </div>
    <h1 class="h1">Governance Aepp</h1>
    <br/>
    <div v-if="polls">
      <div v-for="[id, data] in polls">
        <a @click="$router.push(`/poll/${id}`)">#{{id}} {{data.title}}</a> <span v-if="data.voteCount != null">({{data.voteCount}} votes)</span><br/>
        <span v-if="data.percentOfTotalSupply">{{data.percentOfTotalSupply | formatPercent}} stake - </span>
        <span>{{closeHeight(data.close_height)}}</span>
        <br/>
        <br/>
      </div>
    </div>

    <div @click="$router.push('/create')" class="fixed bottom-0 right-0 p-8">
      <ae-icon name="plus" fill="primary" face="round"
               class="ae-icon-size shadow"></ae-icon>
    </div>
    <div @click="$router.push(`/account/${address}`)" class="fixed bottom-0 left-0 p-8">
      <ae-icon name="contacts" fill="primary" face="round"
               class="ae-icon-size shadow"></ae-icon>
    </div>

  </div>
</template>

<script>
    import aeternity from "~/utils/aeternity";
    import {AeIcon} from '@aeternity/aepp-components/'
    import BiggerLoader from '../components/BiggerLoader'
    import Backend from "~/utils/backend";

    export default {
        name: 'Home',
        components: {AeIcon, BiggerLoader},
        data() {
            return {
                showLoading: true,
                address: null,
                balance: null,
                polls: []
            }
        },
        methods: {
            closeHeight(close_height) {
                console.log(close_height);
                if (!close_height) return "never closes";
                return `closes at ${close_height}`
            }
        },
        async mounted() {
            await aeternity.initClient();
            this.address = aeternity.address;
            this.balance = aeternity.balance;
            const polls = await aeternity.contract.methods.polls();
            this.polls = polls.decodedResult.sort((a, b) => a[1].close_height | Number.MAX_SAFE_INTEGER - b[1].close_height | Number.MAX_SAFE_INTEGER);

            await Backend.pollOverview().then(overview => {
                this.polls = this.polls.map(([id, data]) => {
                    const poll = overview.find(poll => poll.id == id);

                    if (poll) {
                        data.voteCount = poll.details.voteCount;
                        data.percentOfTotalSupply = poll.details.percentOfTotalSupply;
                    }
                    return [id, data];
                });
            }).catch(console.error);

            this.showLoading = false;
        }
    }
</script>

<style scoped>

</style>
