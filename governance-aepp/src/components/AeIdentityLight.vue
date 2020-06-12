<template>
  <div 
    :class="['identity-card', classObject]"
  >
    <div class="flex-row">
      <div class="user-identicon" v-html="avatar.src"></div>
      <span :class="['identity-name-position', collapsedModifier]">
        <span role="heading" :class="['identity-name', collapsedModifier]">{{name}}</span>
        <small class="truncated-address cursor-pointer" v-if="collapsed" @click="$emit('click')">
           {{address}}
        </small>
      </span>
      <div class="balances">
        <div class="balance token">
          <span class="amount">{{additionalText}}</span>
          <span class="amount">{{balance | toAE}}</span>
          <span class="currency-symbol">{{currency}}</span>
        </div>
      </div>
    </div>
    <div
      v-if="!collapsed"
      v-for="(chunk, idx) in chunkAddress"
      :key="idx"
      class="chunk-row">
      <div v-for="(data, idx) in chunk" :key="idx" class="chunk">
        {{data}}
      </div>
    </div>
  </div>
</template>
<script>
    import jdenticon from 'jdenticon';

    /**
     * Displays an Identity with an avatar blockie, the address and an amount of ether
     */
    export default {
        name: 'ae-identity-light',
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
        computed: {
            avatar() {
              jdenticon.config = {
                lightness: {
                  color: [0.4, 1.0],
                  grayscale: [0.5, 1.0],
                },
                saturation: {
                  color: 1.0,
                  grayscale: 1.0,
                },
                backColor: '#12121bff',
              };
              return {
                type: 'identicon',
                src: jdenticon.toSvg(this.address, 32),
              };
            },
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
        },
        filters: {
            shorten: value => value.substr(0, 12),
        },
    }
</script>
<style lang="scss">
  @import '~@aeternity/aepp-components/src/styles/fallback/variables';

  .identity-card {

    .user-identicon {
      display: inline-block;

      svg {
        border-radius: 50%;
      }
    }

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
      width: 34px;
      height: 34px;
    }

    .identity-name-position {
      margin-left: 10px;
      font-weight: 500;
      color: #727278;

      &._collapsed {
        margin-left: 9px;
        margin-right: 9px;
      }
    }

    .identity-name {
      margin: 0;
      font-size: 17px;
      color: #fff;

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

    @media (max-width: 640px) {
      .truncated-address[data-v-4bf5ad98] {
        font-size: 10px !important;
      }
    }

    @media (max-width: 480px) {
      .truncated-address[data-v-4bf5ad98] {
        font-size: 9px !important;
      }

      .avatar,
      .ae-identity-light .avatar {
        width: 20px;
        height: 20px;
      }
      .identity-name-position {
        margin-left: 5px;
        font-weight: 500;
        color: #727278;

        &._collapsed {
          margin-left: 5px;
          margin-right: 5px;
        }
      }
    }

  }
</style>
