<template>
  <div class="mx-4 mt-2 ae-card">
    <div class="bg-primary px-3 w-full text-2xl text-white relative rounded-t ae-max-height-0 overflow-hidden ae-transition-300"
         :key="address"
         :class="{'ae-max-height-40': open}">
      <transition name="fade">
        <div class="absolute flex inset-0 justify-center items-center bg-primary z-20" v-if="showCopyNotice">
          <span>Copied address to clipboard</span>
        </div>
      </transition>
      <div class="flex justify-between items-center mt-2">
        <span><span v-if="isOwnAccount">Your </span> Account</span>
        <img src="../assets/copy.svg" class="w-4 h-4 text-white cursor-pointer" @click="copyToClipboard" alt="copy"/>
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
        <div class="text-sm font-bold font-mono ml-auto" v-if="balance !== null">
          {{balance | toAE}}
        </div>
        <div class="w-5" v-if="canOpen"></div>
      </div>

      <div class="flex justify-between items-center my-3" v-if="delegatedPower">
        <div class="text-xs opacity-90 leading-tight flex-1">
          Estimated delegated stake <br/>
          Delegators votes can overwrite delegation
        </div>
        <div class="text-sm font-bold font-mono ml-auto text-right">
          {{delegatedPower | toAE}}
        </div>
        <div class="w-5" v-if="canOpen"></div>
      </div>
      <div class="flex justify-between items-center my-3" v-else>
        <div class="text-xs opacity-90 leading-tight">
          Could not fetch information about delegated stake.
        </div>
      </div>
    </div>
    <div class="bg-ae-purple text-white pl-3 pr-2 py-2 rounded-b" :class="{'rounded-t': !open, 'pr-3': !canOpen}">
      <div class="flex justify-between items-center">
        <div class="text-xs opacity-90 leading-tight font-bold">
          Estimated voting power
        </div>
        <div class="text-sm font-bold font-mono ml-auto leading-tight mt-1" v-if="totalStake">
          {{totalStake | toAE}}
        </div>
        <div class="w-5 flex justify-center items-center ml-2 ae-transition-300" v-if="canOpen" @click="open = !open"
             :class="{'rotate-90': open}">
          <img src="../assets/open_arrow.svg" class="w-full" alt="show voting power"/>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
  import AeIdentityLight from "./AeIdentityLight";
  import {sdk, wallet} from "@/utils/wallet";
  import Backend from "../utils/backend";
  import BigNumber from "bignumber.js";
  import copy from 'copy-to-clipboard';
  import {toRefs} from "vue";

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
      },
      startOpen: {
        type: Boolean,
        default: true
      },
      canOpen: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        balance: null,
        delegatedPower: null,
        totalStake: null,
        isOwnAccount: false,
        showCopyNotice: false,
        open: true
      }
    },
    setup() {
      const {address, walletStatus, activeWallet, networkId, isStatic} = toRefs(wallet)
      return {walletAddress: address, walletStatus, activeWallet, networkId, isStatic}
    },
    methods: {
      async loadData() {
        if(!this.isStatic) this.isOwnAccount = this.walletAddress === this.address;
        this.balance = await sdk.client.getBalance(this.address);
        await new Backend(this.networkId).delegatedPower(this.address, this.pollAddress).then(delegatedPower => {
          if(delegatedPower === null) {
            this.totalStake = new BigNumber(this.balance);
          } else {
            this.delegatedPower = delegatedPower.delegatedPower;
            this.totalStake = new BigNumber(this.balance).plus(this.delegatedPower);
          }
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
      this.eventBus.on('dataChange', this.loadData)
      this.loadData();
      this.open = this.startOpen;
    },
    beforeUnmount() {
      this.eventBus.off('dataChange', this.loadData)
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

  .rotate-90 {
    transform: rotate(90deg);
  }

  .ae-max-height-0 {
    max-height: 0;
  }

  .ae-max-height-40 {
    max-height: 10rem;
  }
</style>
