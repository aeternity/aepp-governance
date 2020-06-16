<template>
  <div class="ae-card">
    <div class="ae-max-height-0 overflow-hidden ae-transition-300 relative"
         :key="address"
         :class="{'ae-max-height-40': open}">
      <transition name="fade">
        <div class="inset-0 flex justify-center items-center absolute text-white bg-gray-900 z-20" v-if="showCopyNotice">
          <span>Copied address to clipboard</span>
        </div>
      </transition>
      <BlackHeader>
        <div class="w-full flex flex-wrap justify-between items-center">
          <span>Voter Account</span>
          <span class="copy" @click="copyToClipboard" >
            Copy
            <img src="../assets/copy.svg" class="cursor-pointer" alt="copy"/>
          </span>
        </div>
      </BlackHeader>
      <div class="header-row flex flex-wrap justify-between items-center mt-3 relative text-white">
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
        <div class="ml-auto absolute right-0" v-if="balance !== null">
          <span class="ae-value">{{balance | toAE(2, true)}}</span>
          <span class="ae-text">AE</span>
        </div>
      </div>

      <div class="header-row" v-if="delegatedPower">
        <div class="flex text-white">
          Estimated delegated stake:
          <div class="ml-auto text-right">
            <span class="ae-value">{{delegatedPower | toAE(2, true)}}</span>
            <span class="ae-text">AE</span>
          </div>
        </div>
        <div class="text-gray-500 italic">
          You may still vote by yourself, but this voids your delegatee’s vote for you.
        </div>
        <div class="w-5" v-if="canOpen"></div>
      </div>
      <div class="header-row flex justify-between items-center my-3" v-else>
        <div class="text-red">
          Could not fetch information about delegated stake.
        </div>
      </div>
    </div>
    <div class="expand-account" :class="{'rounded-t': !open, 'pr-3': !canOpen, 'can-open': canOpen}">
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
  import BlackHeader from '../components/BlackHeader';
  import caret from '../assets/caret.svg';
  import caretActive from '../assets/caretActive.svg';

  export default {
    name: "AccountHeader",
    components: {BlackHeader, AeIdentityLight},
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
  .expand-account.can-open {
    background-color: #272831;
  }

  .expand-account {
    color: #fff;
    font-size: 15px;
    font-weight: 400;
    border-bottom: 1px solid #12121b;
    padding: 10px 0;
    margin: 0 20px;

    &.can-open{
      border-bottom: none;
      padding: 10px 20px;
      margin: 0;
    }
  }

  .copy {
    cursor: pointer;
    color: #fff;
    font-size: 12px;

    img {
      display: inline;
      width: 1.125rem;
    }
  }

  .header-row {
    padding: 0.625rem 0;
    margin: 0 1.25rem;
    border-bottom: 1px solid #12121b;
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

  @media (max-width: 480px) {
    .expand-account {
      margin: 0 10px;
    }

    .header-row {
      margin: 0 0.625rem;
    }

    .expand-account.can-open {
      padding: 0.625rem;
    }
  }
</style>
