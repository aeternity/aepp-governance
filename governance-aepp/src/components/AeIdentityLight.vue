<template>
  <div :class="classObject">
    <div class="flex-row">
      <ae-identicon class="avatar" :address='address'/>
      <span :class="['identity-name-position', collapsedModifier]">
        <span role="heading" :class="['identity-name', collapsedModifier]">{{ name }}</span>
        <small class="truncated-address cursor-pointer" v-if="collapsed" @click="$emit('click')">
           {{ shortAddress }} •••
        </small>
      </span>
      <div class="balances">
        <div class="balance token">
          <span class="amount">{{ additionalText }}</span>
          <span class="amount">{{ toAE(balance) }}</span>
          <span class="currency-symbol">{{ currency }}</span>
        </div>
      </div>
    </div>
    <div v-if="!collapsed">
      <div
        v-for="(chunk, idx) in chunkAddress"
        :key="idx"
        class="chunk-row">
        <div v-for="(data, idx) in chunk" :key="idx" class="chunk">
          {{ data }}
        </div>
      </div>
    </div>
  </div>
</template>
<script>

import AeIdenticon from "@/components/aepp/AeIdenticon";
import {shorten, toAE} from "@/utils/filters";

    /**
     * Displays an Identity with an avatar blockie, the address and an amount of ether
     */
    export default {
        name: 'ae-identity-light',
        components: {AeIdenticon},
        props: {
            /**
             * An identity name
             */
            name: {
                type: String,
                default: '',
            },
            currency: {
                type: String,
                default: ''
            },
            /**
             * An identity address
             */
            address: {
                type: String,
                default: '0x0',
            },
            /**
             * An identity balance in AE
             */
            additionalText: {
                type: String,
                default: "",
            },
            balance: {
                type: String,
                default: "0",
            },
            collapsed: {
                type: Boolean,
                default: false,
            },
            invert: {
                type: Boolean,
                default: false,
            },
        },
        methods:  {
          toAE: toAE
        },
        computed: {
            classObject() {
                return [
                    'ae-identity-light',
                    this.collapsedModifier,
                    this.invert ? '_invert' : '',
                ]
            },
            chunkAddress() {
                if (this.address.length === 0) return []
                const chunks = this.address.match(/.{1,7}/g)
                const chunkRows = [];
                for (let i = 0; i < Math.ceil(chunks.length / 3); i++) {
                    chunkRows.push(chunks.slice(i * 3, i * 3 + 3))
                }
                return chunkRows
            },
            collapsedModifier() {
                return this.collapsed ? '_collapsed' : ''
            },
            shortAddress() {
              return shorten(this.address)
            }
        },
    }
</script>
<style lang="scss" scoped>
  @import '@/styles/variables.scss';

  .ae-identity-light._invert {
    color: $white;
  }

  .flex-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chunk-row {
    font-family: 'Roboto Mono', monospace;
    font-size: 17px;
    font-weight: 500;
    font-style: normal;
    line-height: 1.53;
    letter-spacing: 3.1px;
    font-stretch: normal;
    text-align: left;

    &:first-of-type {
      margin-top: 14px;
    }
  }

  .chunk {
    display: inline-block;
    width: calc(100% / 3);

    &:nth-child(2n) {
      text-align: center;
    }

    &:nth-child(3n) {
      text-align: right;
    }
  }

  .flex-row + .chunk-row {
    margin-top: 16px;
  }

  .identity-info._long {
    width: calc(100% - 65px);
    overflow: hidden;
  }

  .balances {
    width: auto;
    flex-grow: 1;
  }

  .balance {
    font-family: 'Roboto Mono', monospace;
    font-size: 12px;
    font-stretch: normal;
    line-height: 12px;
    text-align: right;
    margin-top: 2px;

    &:first-of-type {
      margin-top: 0;
    }

    &.token {
      font-weight: bold;
    }
  }

  .currency-symbol {
    letter-spacing: 0.12em;
    padding-right: 3px;
  }

  .ae-identity-light .avatar {
    border-width: 1px;
    width: 23px;
    height: 23px;
  }

  .identity-name-position {
    margin-left: 10px;
    font-weight: 500;

    &._collapsed {
      margin-left: 9px;
      margin-right: 9px;
    }
  }

  .identity-name {
    margin: 0;
    font-size: 17px;

    &._collapsed {
      font-size: 12px;
      margin-top: -2px;
    }
  }

  .truncated-address {
    font-family: 'Roboto Mono', monospace;
    font-size: 11px;
    display: block;
  }

  .identity-name + .truncated-address {
    margin-top: 1px;
  }
</style>
