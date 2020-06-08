<template>
  <div class="">
    <div class="flex bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-t" v-if="data.delegatee" @click="$router.push(`/account/${data.delegatee}`)">
      <AeIdentityLight :address="data.delegatee"
                       :collapsed="true"
                       balance="">
      </AeIdentityLight> voted with this stake in
    </div>
    <div class="poll-listing" @click="$router.push(`/poll/${id}`)">
      <div class="flex items-center vote-id w-full">
        <span class="listing-text">{{data.title}}</span>
      </div>
      <div v-if="showVote" class="mt-2 flex items-center">
        <img src="../assets/check_circle-24px.svg" class="mb-1"> <span class="pl-1 leading-none text-gray-600">{{data.vote}}</span>
      </div>
      <div class="listing-data">
        <span v-if="percentOfTotalSupply"><span class="highlited">{{percentOfTotalSupply | formatPercent(2)}}</span> stake - </span>
        <span v-else-if="loading"><ae-loader/> stake - </span>
        <span v-if="isClosed">closed at {{data.close_height}}(~<span class="highlited">{{Math.abs(timeDifference) | timeDifferenceToString}}</span> ago)</span>
        <span v-else-if="typeof data.close_height !== 'number'">never closes</span>
        <span v-else>closes in <span class="highlited">{{timeDifference | timeDifferenceToString}}</span></span>
      </div>
      <div class="listing-id">
        <img src="../assets/hash.svg" alt="hash"/>
        <span>{{id}}</span>
      </div>
    </div>
  </div>
</template>

<script>

  import "@aeternity/aepp-components/dist/aeLoader/aeLoader.css"
  import AeLoader from "@aeternity/aepp-components/dist/aeLoader/"


  import Backend from "../utils/backend";
  import aeternity from "../utils/aeternity";
  import AeIdentityLight from './AeIdentityLight'

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

<style lang="scss" scoped>
.poll-listing {
  padding: 10px 15px;
  background-color: #292B35;
  border-radius: 5px;
  margin-bottom: 15px;
  position: relative;
}

.listing-text {
  color: #fff;
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 15px;
}

.listing-data {
  color: #727278;
  font-size: 15px;
  font-weight: 400;
}

.highlited {
  color: #AEAEAE;
}

.listing-id {
  position: absolute;
  bottom: 3px;
  right: 3px;
  color: #2A9CFF;
  font-size: 15px;
  background-color: #21222C;
  padding: 3px 5px;
  border-bottom-right-radius: 5px;
  border-top-left-radius: 5px;

  img {
    display: inline;
    height: 15px;
  }

  span {
    font-weight: 600;
    vertical-align: middle;
    margin-left: -3px;
  }
}
</style>
