<template>
  <div>
    <h1>Governance Aepp</h1>
    <div v-if="address && balance">
      <span>{{address}}</span>
      <br/>
      <span>Balance: {{balance}} AE</span>
    </div>
    <br />
    <div v-if="polls">
      <div v-for="[id, data] in polls">
        <span>#{{id}} {{data.title}} ({{data.votes_count}} votes)</span>
      </div>
    </div>
  </div>
</template>

<script>
    import aeternity from "~/utils/aeternityNetwork";
    import pollContractSource from '../../../governance-contracts/contracts/Poll.aes'

    export default {
        name: 'Home',
        components: {},
        data() {
            return {
                aeternity: null,
                address: null,
                balance: null,
                polls: []
            }
        },
        computed: {},
        methods: {
            async createPoll() {
                const metadata = {
                    title: "Testing",
                    description: "This Poll is created for Testing purposes only",
                    link: "https://aeternity.com/",
                    is_listed: true
                };
                const vote_options = {0: "Yes, test more", 1: "No, test less", 2: "Who cares?"};
                const close_height = Promise.reject();

                const pollContract = await aeternity.client.getContractInstance(pollContractSource);
                const init = await pollContract.methods.init(metadata, vote_options, close_height);
                const addPoll = await aeternity.contract.methods.add_poll(init.address);
                console.log("addPoll", addPoll)
            }
        },
        async mounted() {
            await aeternity.initClient();
            this.address = aeternity.address;
            this.balance = aeternity.balance;
            const pollsOverview = await aeternity.contract.methods.polls_overview();
            console.log(pollsOverview.decodedResult[0]);
            this.polls = pollsOverview.decodedResult;

            //await this.createPoll();
        }
    }
</script>

<style scoped>

</style>
