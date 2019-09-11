<template>
  <div>
    <div class="bg-primary px-6 py-4 w-full text-2xl text-white relative" :key="address">
      <transition name="fade">
        <div class="absolute flex inset-0 justify-center items-center bg-primary z-10" v-if="showCopyNotice">
          <span>Copied address to clipboard</span>
        </div>
      </transition>
      <div class="flex justify-between items-center">
        <span><span v-if="isOwnAccount">Your </span> Account</span>
        <img src="../assets/copy.svg" class="w-4 h-4" @click="copyToClipboard" />
      </div>
      <div class="flex justify-between items-center mt-3">
        <div>
          <AeIdentityLight
            :collapsed="true"
            :balance="''"
            :address="address"
            class="text-white"
            :invert="true"
            @click="copyToClipboard"
          />
        </div>
        <div class="text-sm font-bold font-mono" v-if="balance">
          {{balance | toAE}}
        </div>
      </div>

      <div class="flex justify-between items-center mt-3" v-if="delegatedPower">
        <div class="text-xs opacity-90 leading-tight">
          Estimated delegated stake <br/>
          Delegators votes can overwrite delegation
        </div>
        <div class="text-sm font-bold font-mono">
          {{delegatedPower | toAE}}
        </div>
      </div>
      <div class="flex justify-between items-center mt-3" v-else>
        <div class="text-xs opacity-90 leading-tight">
          Could not fetch information about delegated stake.
        </div>
      </div>
    </div>
    <div class="bg-ae-purple text-white  px-6 py-2">
      <div class="flex justify-between items-center">
        <div class="text-xs opacity-90 leading-tight font-bold">
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
  import copy from 'copy-to-clipboard';

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
        isOwnAccount: false,
        showCopyNotice: false
      }
    },
    methods: {
      async loadData() {
        this.isOwnAccount = aeternity.address === this.address;
        this.balance = await aeternity.client.balance(this.address);
        await Backend.delegatedPower(this.address, this.pollAddress).then(delegatedPower => {
          this.delegatedPower = delegatedPower.delegatedPower;
          this.totalStake = new BigNumber(this.balance).plus(this.delegatedPower);
        }).catch(e => {
          console.error(e);
          this.totalStake = new BigNumber(this.balance);
        });
      },
      copyToClipboard() {
        copy(this.address);
        this.showCopyNotice = true;
        setTimeout(() => {
          this.showCopyNotice = false;
        }, 1500)
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

  .opacity-90 {
    opacity: .9;
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity .3s;
  }

  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */
  {
    opacity: 0;
  }
</style>
