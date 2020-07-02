<template>
  <div class="identity-card" :class="[classObject]">
    <div class="flex flex-wrap relative">
      <div class="user-identicon inline-block" v-html="avatar.src"></div>
      <span class="identity-name-position text-gray-500 flex items-center ml-3 font-medium" :class="[collapsedModifier]">
        <span role="heading" class="identity-name m-0 text-white" :class="[collapsedModifier]">{{name}}</span>
      </span>
      <div class="balances w-auto flex flex-grow items-center justify-end">
        <div class="balance token whitespace-no-wrap text-right text-xs text-base font-normal">
          <span class="amount text-white">{{additionalText}}</span>
          <span class="amount text-white">{{balance | toAE}}</span>
          <span class="currency-symbol text-blue">{{currency}}</span>
        </div>
      </div>
      <small class="truncated-address text-gray-500 block cursor-pointer w-full flex-shrink-0" v-if="collapsed" @click="$emit('click')">
         {{address}}
      </small>
    </div>
    <div
      v-if="!collapsed"
      v-for="(chunk, idx) in chunkAddress"
      :key="idx"
      class="chunk-row font-medium not-italic text-left">
      <div v-for="(data, idx) in chunk" :key="idx" class="chunk inline">
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
  .identity-card {
    .balance.token {
      font-family: inherit;
    }

    .user-identicon {
      svg {
        border-radius: 50%;
      }
    }

    .ae-identity-light._invert {
      color: #fff;
    }

    .chunk-row {
      font-family: 'Roboto Mono', monospace;
      font-size: 1.0625rem;
      line-height: 1.53;
      letter-spacing: 0.19375rem;
      font-stretch: normal;

      &:first-of-type {
        margin-top: 0.875rem;
      }
    }

    .chunk {
      width: calc(100% / 3);

      &:nth-child(2n) {
        text-align: center;
      }

      &:nth-child(3n) {
        text-align: right;
      }
    }

    .identity-info._long {
      width: calc(100% - 4.0625rem);
      overflow: hidden;
    }

    .balance {
      font-family: 'Roboto Mono', monospace;
      font-stretch: normal;
      line-height: 0.75rem;
      margin-top: 0.125rem;

      &:first-of-type {
        margin-top: 0;
      }

      &.token {
        font-weight: bold;
      }
    }

    .currency-symbol {
      letter-spacing: 0.12rem;
      padding-right: 0.1875rem;
    }

    .ae-identity-light .avatar {
      border-width: 0.0625rem;
      width: 2.125rem;
      height: 2.125rem;
    }

    .identity-name-position._collapsed {
        margin-left: 0.5625rem;
        margin-right: 0.5625rem;
    }

    .truncated-address {
      font-family: 'Roboto Mono', monospace;
      font-size: 0.6875rem;
    }

    .identity-name + .truncated-address {
      margin-top: 0.0625rem;
    }
  }
  @media (max-width: 480px) {
    .avatar,
    .ae-identity-light .avatar {
      width: 1.25rem;
      height: 1.25rem;
    }

    .identity-name-position {
      margin-left: 0.3126;

      &._collapsed {
        margin-left: 0.3126;
        margin-right: 0.3126;
      }
    }
  }

  @media (max-width: 360px) {
    .truncated-address {
      font-size: 0.5625rem !important;
    }
  }
</style>
