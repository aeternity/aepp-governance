<template>
  <div>
    <div class="overlay-loader" v-show="showLoading">
      <BiggerLoader></BiggerLoader>
    </div>
    <h1 class="h1">Governance Aepp</h1>
    <br/>
    <div v-if="polls">
      <div v-for="[id, data] in polls">
        <a @click="$router.push(`/poll/${id}`)">#{{id}} {{data.title}} ({{data.votes_count}} votes)</a>
        <br/>
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
        computed: {},
        methods: {
            closeHeight(close_height) {
                if (close_height === "None") return "poll never closes"
                return `poll closes at block ${close_height.Some[0]}`
            }
        },
        async mounted() {
            await aeternity.initClient();
            this.address = aeternity.address;
            this.balance = aeternity.balance;
            const pollsOverview = await aeternity.contract.methods.polls_overview();
            this.polls = pollsOverview.decodedResult;
            this.showLoading = false;
        }
    }
</script>

<style scoped>

</style>
