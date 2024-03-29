<template>
  <div class="ae-card cursor-pointer">
    <div class="flex bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-t" v-if="data.delegatee" @click="$router.push(`/account/${data.delegatee}`)">
      <AeIdentityLight :address="data.delegatee"
                       :collapsed="true"
                       balance="">
      </AeIdentityLight> voted with this stake in
    </div>
    <div class="p-4 pb-2" @click="$router.push(`/poll/${id}`)">
      <div class="flex items-center vote-id w-full">
        <img class="h-6" src="../assets/hash.svg" alt="hash"/>
        <span class="text-primary text-2xl leading-none mr-2">{{id}}</span>
        <span class="text-2xl leading-none break-words max-w-85">{{data.title}}</span>
      </div>
      <div v-if="showVote" class="mt-2 flex items-center">
        <img src="../assets/check_circle-24px.svg" class="mb-1" alt="checkbox"> <span class="pl-1 leading-none text-gray-600">{{data.vote}}</span>
      </div>
      <div class="text-gray-500 text-sm mt-1">
        <span v-if="percentOfTotalSupply">{{percentOfTotalSupply}} stake - </span>
        <span v-else-if="loading"><ae-loader/> stake - </span>
        <span v-if="isClosed">closed at {{data.close_height}} (~{{absTimeDifferenceString}} ago)</span>
        <span v-else-if="typeof data.close_height !== 'bigint'">never closes</span>
        <span v-else>closes in {{timeDifferenceString}}</span>
      </div>
    </div>
  </div>
</template>

<script>
  import Backend from "../utils/backend";
  import AeIdentityLight from './AeIdentityLight'
  import {sdk, wallet} from "@/utils/wallet";
  import AeLoader from "@/components/aepp/AeLoader";
  import {formatPercent, timeDifferenceToString} from "@/utils/filters";

  export default {
    components: {AeLoader, AeIdentityLight},
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
        return Number(this.data.close_height) < this.height
      },
      timeDifference() {
        return (Number(this.data.close_height) - this.height) * 3 * 60 * 1000;
      },
      timeDifferenceString() {
        return timeDifferenceToString(this.timeDifference)
      },
      absTimeDifferenceString() {
        return timeDifferenceToString(Math.abs(this.timeDifference))
      }
    },
    async mounted() {
      new Backend(wallet.networkId).pollOverview(this.data.poll).then(overview => {
        if(overview !== null) {
          this.percentOfTotalSupply = overview.percentOfTotalSupply ? formatPercent(overview.percentOfTotalSupply, 2): null;
          this.voteCount = overview.voteCount;
        }
        this.loading = false;
      }).catch(e => {
        console.error(e);
        this.loading = false;
      });
      this.height = await sdk.getHeight()
    }
  };
</script>

<style scoped>

</style>
