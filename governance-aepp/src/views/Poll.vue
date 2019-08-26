<template>
  <div>
    <div class="overlay-loader" v-show="showLoading">
      <BiggerLoader></BiggerLoader>
    </div>
    <div v-if="pollState.metadata">
      <AccountHeader :address="accountAddress" :poll-address="pollAddress" v-if="accountAddress"></AccountHeader>
      <div class="flex justify-between m-4 mb-2">
        <div>
          <h1 class="text-3xl leading-tight">{{pollState.metadata.title}}</h1>
        </div>
        <div class="h-8 flex items-center vote-id justify-end">
          <img class="h-full" src="../assets/hash.svg"/>
          <span class="text-primary text-4xl leading-none">{{pollId}}</span>
        </div>
      </div>
      <div class="text-gray-500 mx-4 font-xl">
        {{pollState.metadata.description}}
      </div>
      <div class="text-gray-500 mx-4 my-2 font-xl">
        <a :href="pollState.metadata.link" class="text-blue-500 opacity-75">{{pollState.metadata.link}}</a>
      </div>
      <div class=" mx-4 my-2 flex">
        <span class="text-sm mr-1 text-gray-500">BY:</span>
        <div class="text-primary">
          <ae-identity-light
            :collapsed="true"
            :balance="''"
            :address="pollState.author"
          />
        </div>
      </div>
      <div class="relative h-4 w-full">
        <div class="absolute inset-0 flex h-full w-full justify-center items-center px-4">
          <div class="border w-full"></div>
        </div>
        <div class="absolute inset-0 flex h-full w-full justify-center items-center">
          <div class="bg-ae-gray px-2">
            <span class="text-gray-500 opacity-75">POLL</span>
          </div>
        </div>
      </div>

      <div class="text-center w-full mt-2 text-gray-500 text-sm" v-if="pollVotesState && pollVotesState.totalStake">
        Total Stake: {{pollVotesState.totalStake | toAE}} ({{pollVotesState.percentOfTotalSupply | formatPercent}})
      </div>

      <!-- POLL OPTIONS -->

      <div v-for="[id, title] in pollState.vote_options" v-if="pollState.vote_options">
        <div class="m-4 ae-card" @click="showVoters(id)">
          <div class="flex justify-between items-center w-full py-4 px-3">
            <ae-check class="mr-1" v-model="voteOption" :value="id" type="radio" @click.stop.prevent @change="vote(id)"></ae-check>
            <!-- TODO find better solution than this -->
            <div class="mr-auto" style="margin-top: 4px">
              <span
                class="font-bold mr-1" v-if="pollVotesState">{{pollVotesState.stakesForOption[id].percentageOfTotal | formatPercent}}</span>
              <span>{{title}}</span>
            </div>
            <span style="margin-top: 4px" class="block" v-if="pollVotesState">
              <img src="../assets/back_gray.svg" class="transition"
                   :class="{'rotate-90': votersForOption.id != null && votersForOption.id == id}">
            </span>
          </div>
          <div class="h-1 bg-primary rounded-bl" v-if="pollVotesState"
               :class="{'rounded-br': pollVotesState.stakesForOption[id].percentageOfTotal > 99}"
               :style="{'width': `${pollVotesState.stakesForOption[id].percentageOfTotal}%`}">
          </div>
        </div>
        <div class="text-gray-500 text-sm mx-4" v-show="votersForOption.id != null && votersForOption.id == id">
          <div class="text-gray-500 text-sm my-1 mx-2" v-if="pollVotesState">
            {{pollVotesState.stakesForOption[id].percentageOfTotal | formatPercent}}
            ({{pollVotesState.stakesForOption[id].optionStake | toAE}}) -
            {{pollVotesState.stakesForOption[id].votes.length}} Votes -
            {{pollVotesState.stakesForOption[id].delegatorsCount}} Delegators
          </div>
          <div v-for="voter in votersForOption.voters">
            <ae-identity-light
              :collapsed="true"
              :additionalText="voter.delegatorsCount ? voter.delegatorsCount + ' D - ' : ''"
              :balance="voter.stake"
              :address="voter.account"
              class="mx-2"
            />
          </div>
        </div>
      </div>
      <BottomButtons back="/" :add-poll="true" :cta-text="voteOption !== null ?  'Revoke Vote' : null "
                     :account="accountAddress"
                     :cta-action="revokeVote"></BottomButtons>
      <CriticalErrorOverlay :error="error" @continue="error = null"></CriticalErrorOverlay>
    </div>

  </div>
</template>

<script>
  import aeternity from "~/utils/aeternity";
  import {AeButton, AeCheck, AeIcon, AeToolbar, AeCard} from '@aeternity/aepp-components/'
  import pollContractSource from '../../../governance-contracts/contracts/Poll.aes'
  import Backend from "~/utils/backend";
  import BiggerLoader from '../components/BiggerLoader';
  import AeIdentityLight from '../components/AeIdentityLight'
  import BigNumber from 'bignumber.js';
  import BottomButtons from "~/components/BottomButtons";
  import AccountHeader from "~/components/AccountHeader";
  import GrayText from "~/components/GrayText";
  import CriticalErrorOverlay from "~/components/CriticalErrorOverlay";

    export default {
        name: 'Home',
        components: {BottomButtons, AeIcon, AeCheck, AeButton, AeToolbar, BiggerLoader, AeIdentityLight},
        data() {
            return {
                accountAddress: null,
                pollAddress: null,
                balance: null,
                totalStake: null,
                showLoading: true,
                pollId: null,
                delegateeVote: {},
                voteOption: null,
                pollContract: null,
                pollState: {},
                pollVotesState: null,
                votersForOption: {},
                delegatedPower: null,
            }
        },
        computed: {},
        methods: {
            async vote() {
                this.showLoading = true;
                await this.pollContract.methods.vote(this.voteOption);
                Backend.contractEvent("Vote", this.pollAddress);
                await this.loadData();
            },
            async revokeVote() {
                this.showLoading = true;
                await this.pollContract.methods.revoke_vote();
                Backend.contractEvent("RevokeVote", this.pollAddress);
                await this.loadData();
            },
            showVoters(id) {
                if (this.votersForOption.id != null && this.votersForOption.id == id) {
                    this.votersForOption = {};
                    return;
                }
  export default {
    name: 'Home',
    components: {
      CriticalErrorOverlay,
      GrayText,
      AccountHeader, BottomButtons, AeIcon, AeCheck, AeButton, AeToolbar, BiggerLoader, AeIdentityLight, AeCard
    },
    data() {
      return {
        accountAddress: null,
        balance: null,
        showLoading: true,
        pollId: null,
        delegateeVote: {},
        voteOption: null,
        pollContract: null,
        pollState: {},
        pollVotesState: null,
        pollAddress: null,
        votersForOption: {},
        error: null
      }
    },
    computed: {},
    methods: {
      async vote(id) {
        this.showLoading = true;
        this.voteOption = id;
        try {
          await this.pollContract.methods.vote(this.voteOption);
        } catch (e) {
          console.error(e);
          this.error = 'Could not process your vote. Please try again.';
        }

        try {
          await this.loadData();
        } catch (e) {
          console.error(e);
          this.showLoading = false;
          this.error = 'Could not process your vote. Please try again.';
        }
      },
      async revokeVote() {
        this.showLoading = true;
        try {
          await this.pollContract.methods.revoke_vote();
          await this.loadData();
        } catch (e) {
          console.error(e);
          this.showLoading = false;
          this.error = 'Could not revoke your vote. Please try again.';
        }
      },
      showVoters(id) {
        if (this.votersForOption.id != null && this.votersForOption.id == id) {
          this.votersForOption = {};
          return;
        }

        if(!this.pollVotesState) return;

        const votes = this.pollVotesState.stakesForOption.find(option => option.option === id.toString()).votes;
        const votesAggregation = votes.map(vote => {
          return {
            account: vote.account,
            stake: vote.stake,
            delegatorsCount: vote.delegators.length
          };
        });

        this.votersForOption = {
          id: id,
          voters: votesAggregation.sort((a, b) => new BigNumber(b.stake).comparedTo(new BigNumber(a.stake)))
        };
      },
      async loadData() {
        this.pollId = this.$route.params.id;
        this.accountAddress = aeternity.address;
        this.votersForOption = {};

        this.balance = await aeternity.client.balance(aeternity.address);

        const poll = await aeternity.contract.methods.poll(this.pollId);
        this.pollAddress = poll.decodedResult.poll;
        this.pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: this.pollAddress});
        this.pollState = (await this.pollContract.methods.get_state()).decodedResult;

        const accountVote = this.pollState.votes.find(([voter, _]) => voter === this.accountAddress);
        this.voteOption = accountVote ? accountVote[1] : null;

        await Backend.votesState(this.pollAddress).then((votesState) => {
          this.pollVotesState = votesState;
          this.delegateeVote = this.pollVotesState.stakesForOption
            .map(data => data.votes.find(vote => vote.delegators
              .some(delegation => delegation.delegator === this.accountAddress))).find(x => x) || {};
        }).catch(console.error);

        this.showLoading = false;
      }
    },
    async mounted() {
      this.loadData();
    }
  }
</script>

<style scoped>
  .vote-id {
    min-width: 85px;
  }

  .bg-ae-gray {
    background-color: #f8f8f8;
  }

  .ae-card {
    border-radius: 5px;
    box-shadow: 0 1px 5px 0 rgba(0, 0, 0, 0.15);
    background-color: #ffffff;
  }

  .transition {
    transition: 300ms;
  }

  .rotate-90 {
    transform: rotate(-90deg);
  }

</style>
