<template>
  <div class="ae-card cursor-pointer">
    <div class="flex bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-t" v-if="data.delegatee" @click="$router.push(`/account/${data.delegatee}`)">
      <AeIdentityLight :address="data.delegatee"
                       :collapsed="true"
                       balance="">
      </AeIdentityLight> voted with your stake in
    </div>
    <div class="p-4 pb-2" @click="$router.push(`/poll/${id}`)">
      <div class="flex items-center vote-id w-full">
        <img class="h-6" src="../assets/hash.svg" alt="hash"/>
        <span class="text-primary text-2xl leading-none mr-2">{{id}}</span>
        <span class="text-2xl leading-none break-words max-w-85">{{data.title}}</span>
      </div>
      <div v-if="showVote" class="mt-2 flex items-center">
        <img src="../assets/check_circle-24px.svg" class="mb-1"> <span class="pl-1 leading-none text-gray-600">{{data.vote}}</span>
      </div>
      <div class="text-gray-500 text-sm mt-1">
        <span v-if="percentOfTotalSupply">{{percentOfTotalSupply | formatPercent(2)}} stake - </span>
        <span v-else-if="loading"><ae-loader/> stake - </span>
        <span v-if="isClosed">closed at {{data.close_height}} (~{{Math.abs(timeDifference) | timeDifferenceToString}} ago)</span>
        <span v-else-if="typeof data.close_height !== 'number'">never closes</span>
        <span v-else>closes in {{timeDifference | timeDifferenceToString}}</span>
      </div>
    </div>
  </div>
</template>

<script>
  import {AeLoader} from '@aeternity/aepp-components/src/components/';
  import Backend from "~/utils/backend";
  import aeternity from "~/utils/aeternity";
  import AeIdentityLight from '~/components/AeIdentityLight'

  export default {
    components: {AeLoader, AeIdentityLight},
    data() {
      return {
        loading: true,
        percentOfTotalSupply: null,
        voteCount: null,
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
        return this.data.close_height < aeternity.height
      },
      timeDifference() {
        return (this.data.close_height - aeternity.height) * 3 * 60 * 1000;
      }
    },
    mounted() {
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
    }
  };
</script>

<style scoped>

</style>
