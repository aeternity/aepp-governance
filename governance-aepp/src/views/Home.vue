<template>
  <div class="pb-20">
    <div class="overlay-loader" v-show="showLoading && false">
      <BiggerLoader></BiggerLoader>
    </div>
    <BlackHeader>
      Open Polls
    </BlackHeader>
    <br/>
    <div v-if="polls">
      <div v-for="[id, data] in polls">
        <PollListing :id="id" :data="data"/>
      </div>
    </div>
    <BottomButtons :home="false" :account="address" :add-poll="true" :search-bar="true"></BottomButtons>
  </div>
</template>

<script>
  import aeternity from "~/utils/aeternity";
  import {AeIcon} from '@aeternity/aepp-components/'
  import BiggerLoader from '../components/BiggerLoader'
  import PollListing from "~/components/PollListing";
  import BottomButtons from "~/components/BottomButtons";
  import BlackHeader from "~/components/BlackHeader";

  export default {
    name: 'Home',
    components: {BlackHeader, BottomButtons, PollListing, AeIcon, BiggerLoader},
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
