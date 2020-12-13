<template>
  <div>
    <div class="flex bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-t" v-if="data.delegatee" @click="$router.push(`/account/${data.delegatee}`)">
      <AeIdentityLight :address="data.delegatee"
                       :collapsed="true"
                        balance="">
      </AeIdentityLight> voted with this stake in
    </div>
  <div class="mb-4 bg-black-initial py-3 px-4 relative rounded cursor-pointer" @click="$router.push(`/poll/${id}`)">
      <div class="flex items-center vote-id w-full">
        <span class="mb-4 font-normal text-lg text-white">{{data.title}}</span>
      </div>
    <div v-if="showVote" class="vote items-center mb-3 flex">
      <Checkbox :value="true" type="radio" v-model="showVote"/> <span class="vote-text ml-1 text-white text-base font-normal">{{data.vote}}</span>
    </div>
      <div class="text-gray-500 text-base font-normal">
        <span v-if="percentOfTotalSupply"><span class="highlighted">{{percentOfTotalSupply | formatPercent(2)}}</span> stake - </span>
        <span v-else-if="loading"><ae-loader/> stake - </span>
        <span v-if="isClosed">closed <span class="highlighted">{{Math.abs(timeDifference) | timeDifferenceToString}}</span> ago (Block {{data.close_height}}) </span>
        <span v-else-if="typeof data.close_height !== 'number'">never closes</span>
        <span v-else>closes in <span class="highlighted">{{timeDifference | timeDifferenceToString}}</span></span>
      </div>
    <div class="listing-id absolute text-blue text-base bg-black-100 px-1 rounded-br rounded-tl">
        <img src="../assets/hash.svg" alt="hash" class="inline h-4"/>
        <span class="text-semibold align-middle">{{id}}</span>
      </div>
    </div>
  </div>
</template>

<script>

  import "@aeternity/aepp-components/dist/aeLoader/aeLoader.css"
  import AeLoader from "@aeternity/aepp-components/dist/aeLoader/"
  import Checkbox from "./Checkbox.vue"


  import Backend from "../utils/backend";
  import aeternity from "../utils/aeternity";
  import AeIdentityLight from './AeIdentityLight'

  export default {
    components: {AeLoader, AeIdentityLight, Checkbox},
    data() {
      return {
        loading: true,
        percentOfTotalSupply: null,
        voteCount: null,
        height: 0
      };
    },
    props: {
      id: {
        type: Number
      },
      data: {
        type: Object
      },
      showVote: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      isClosed() {
        return this.data.close_height < this.height
      },
      timeDifference() {
        return (this.data.close_height - this.height) * 3 * 60 * 1000;
      }
    },
    async mounted() {
      new Backend(aeternity.networkId).pollOverview(this.data.poll).then(overview => {
        if(overview !== null) {
          this.percentOfTotalSupply = overview.percentOfTotalSupply;
          this.voteCount = overview.voteCount;
        }
        this.loading = false;
      }).catch(e => {
        console.error(e);
        this.loading = false;
      });
      this.height = await aeternity.client.height()
    }
  };
</script>

<style lang="scss" scoped>
.listing-id {
  bottom: 0.1875rem;
  right: 0.1875rem;
  padding-top: 0.1875rem;
  padding-bottom:  0.1875rem;

  span {
    margin-left: -0.1875rem;
  }
}
</style>
