<template>
  <div>
    <div class="overlay-loader" v-show="showLoading">
      <BiggerLoader></BiggerLoader>
    </div>
    <h1 class="h1">Governance Aepp</h1>
    <br/>
    <div v-if="polls">
      <div v-for="[id, data] in polls">
        <PollListing :id="id" :data="data"/>
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
    import PollListing from "~/components/PollListing";

    export default {
        name: 'Home',
        components: {PollListing, AeIcon, BiggerLoader},
        data() {
            return {
                showLoading: true,
                address: null,
                balance: null,
                pollOverview: [],
                polls: []
            }
        },
        async mounted() {
            await aeternity.initClient();

            this.address = aeternity.address;
            this.balance = aeternity.balance;
            this.polls = await aeternity.polls();

            this.showLoading = false;
        }
    }
</script>

<style scoped>

</style>
