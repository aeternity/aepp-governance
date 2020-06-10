<template>
  <div class="ae-card">
    <div class="header ae-max-height-0 overflow-hidden ae-transition-300"
         :key="address"
         :class="{'ae-max-height-40': open}">
      <transition name="fade">
        <div class="copy-overlay inset-0" v-if="showCopyNotice">
          <span>Copied address to clipboard</span>
        </div>
      </transition>
      <div class="title">
        <span><span v-if="isOwnAccount">Your </span> Account</span>
        <span class="copy">
          Copy
          <img src="../assets/copy.svg" class="cursor-pointer" @click="copyToClipboard" alt="copy"/>
        </span>
      </div>
      <div class="header-row flex justify-between items-center mt-3">
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
      </div>

      <div class="header-row" v-if="delegatedPower">
        <div class="flex ">
          Estimated delegated stake:
          <div class="ml-auto text-right">
            <span class="ae-value">{{delegatedPower | toAE(2, true)}}</span>
            <span class="ae-text">AE</span>
          </div>
        </div>
        <div class="sub-text">
          Delegators votes can overwrite delegation
        </div>
        <div class="w-5" v-if="canOpen"></div>
      </div>
      <div class="header-row flex justify-between items-center my-3" v-else>
        <div class="leading-tight">
          Could not fetch information about delegated stake.
        </div>
      </div>
    </div>
    <div class="expand-account" :class="{'rounded-t': !open, 'pr-3': !canOpen, 'canOpen': canOpen}">
      <div class="flex justify-between items-center">
        <div>
          Estimated voting power
        </div>
        <div class="ml-auto" v-if="totalStake">
          <span class="ae-value">{{totalStake | toAE(2, true)}}</span>
          <span class="ae-text">AE</span>
        </div>
        <div class="w-5 flex justify-center items-center ml-2 ae-transition-300 cursor-pointer" v-if="canOpen" @click="open = !open"
             :class="{'rotate-90': open}">
          <img :src="open ? caretActive : caret" alt="show voting power"/>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
  import AeIdentityLight from "./AeIdentityLight";
  import aeternity from "../utils/aeternity";
  import Backend from "../utils/backend";
  import BigNumber from "bignumber.js";
  import copy from 'copy-to-clipboard';
  import { EventBus } from '../utils/eventBus';
  import Util from '../utils/util';
  import caret from '../assets/caret.svg';
  import caretActive from '../assets/caretActive.svg';

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
        open: true,
        caret,
        caretActive
      }
    },
    methods: {
      async loadData() {
        this.isOwnAccount = (await aeternity.client.address()) === this.address;
        this.balance = await aeternity.client.getBalance(this.address);
        await new Backend(aeternity.networkId).delegatedPower(this.address, this.pollAddress).then(delegatedPower => {
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
      EventBus.$on('dataChange', this.loadData)
      this.loadData();
      this.open = this.startOpen;
    },
    beforeDestroy() {
      EventBus.$off('dataChange', this.loadData)
    }
  }
</script>

<style lang="scss" scoped>
  .header {
    position: relative;
  }

  .title {
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #2a9cff;
    font-size: 20px;
    font-weight: 400;
  }

  .expand-account.canOpen,
  .title {
    background-color: #272831;
  }

  .expand-account {
    color: #fff;
    font-size: 15px;
    font-weight: 400;
    border-bottom: 1px solid #12121b;
    padding: 10px 0;
    margin: 0 20px;

    &.canOpen{
      border-bottom: none;
      padding: 10px 20px;
      margin: 0;
    }
  }

  .copy {
    color: #fff;
    font-size: 12px;

    img {
      display: inline;
      width: 18.2px;
    }
  }

  .copy-overlay {
    background-color: #12121b;
    color: #fff;
    position: absolute;
    z-index: 20;
    display: flex;
    justify-content: center;
    align-items: center; 
  }

  .header-row {
    padding: 10px 0;
    margin: 0 20px;
    border-bottom: 1px solid #12121b;
    color: #fff;
    font-size: 15px;
    font-weight: 400;
  }

  .sub-text {
    color: #727278;
    font-style: italic;
  }

  .rotate-90 {
    transform: rotate(90deg);
  }

  .ae-max-height-0 {
    max-height: 0;
  }

  .ae-max-height-40 {
    max-height: 20rem;
  }

  @media only screen
  and (max-device-width: 480px)
  and (-webkit-min-device-pixel-ratio: 2) {
    .expand-account {
      margin: 0 10px;
    }

    .header-row {
      margin: 0 10px;
    }

    .title,
    .expand-account.canOpen {
      padding: 10px;
    }
  }
</style>
