<template>
  <div>
    <div class="bg-primary px-6 py-4 w-full text-2xl text-white" :key="address">
      <span v-if="isOwnAccount">Your</span> Account
      <div class="flex justify-between items-center mt-3">
        <div>
          <AeIdentityLight
            :collapsed="true"
            :balance="''"
            :address="address"
            class="text-white"
            :invert="true"
          />
        </div>
        <div class="text-sm font-bold font-mono" v-if="balance">
          {{balance | toAE}}
        </div>
      </div>

      <div class="flex justify-between items-center mt-3">
        <div class="text-xs opacity-75 leading-tight">
          Estimated delegated stake <br />
          Delegators votes can overwrite delegation
        </div>
        <div class="text-sm font-bold font-mono" v-if="delegatedPower">
          {{delegatedPower | toAE}}
        </div>
      </div>
    </div>
    <div class="bg-ae-purple text-white  px-6 py-2">
      <div class="flex justify-between items-center">
        <div class="text-xs opacity-75 leading-tight font-bold">
          Estimated voting power
        </div>
        <div class="text-sm font-bold font-mono" v-if="totalStake">
          {{totalStake | toAE}}
        </div>
      </div>
    </div>
  </div>

</template>

<script>
  import AeIdentityLight from "~/components/AeIdentityLight";
  import aeternity from "~/utils/aeternity";
  import Backend from "~/utils/backend";
  import BigNumber from "bignumber.js";

  export default {
    name: "AccountHeader",
    components: {AeIdentityLight},
    props: {
      address: {
        type: String,
        default: '',
        required: true
      },
      pollAddress: {
        type: String,
        default: null
      }
    },
    data() {
      return {
        balance: null,
        delegatedPower: null,
        totalStake: null,
        isOwnAccount: false
      }
    },
    methods: {
      async loadData() {
        this.isOwnAccount = aeternity.address === this.address
        this.balance = await aeternity.client.balance(this.address);
        await Backend.delegatedPower(this.address, this.pollAddress).then(delegatedPower => {
          this.delegatedPower = delegatedPower.delegatedPower;
          this.totalStake = new BigNumber(this.balance).plus(this.delegatedPower);
        }).catch(console.error);
      }
    },
    watch: {
      address() {
        this.loadData()
      }
    },
    created() {
      this.loadData()
    }
  }
</script>

<style scoped>
  .bg-primary {
    box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.15);
  }
  .bg-ae-purple {
    background-color: #d12869;
  }
</style>
