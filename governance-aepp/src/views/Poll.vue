<template>
  <div>
    <div class="overlay-loader" v-show="showLoading && !error">
      <BiggerLoader></BiggerLoader>
    </div>
    <div v-if="pollState.metadata">
      <AccountHeader class="mb-4" :address="accountAddress" :poll-address="pollAddress"
                     v-if="accountAddress && !isClosed"></AccountHeader>
      <div v-if="isClosed" class="text-center">
        <div class="text-gray-500 mt-4">POLL CLOSED</div>
      </div>
      <div class="flex justify-between mx-4 mt-4 mb-2">
        <div class="max-w-75">
          <h1 class="text-3xl leading-tight w-full break-words">{{pollState.metadata.title}}</h1>
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
            balance=""
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
        Stake: {{pollVotesState.totalStake | toAE}} ({{pollVotesState.percentOfTotalSupply | formatPercent}}) -
        {{isClosed ? 'Closed' : 'Closes'}} {{typeof pollState.close_height === 'number' ? `at ${pollState.close_height}`
        : 'never'}}
      </div>

      <!-- POLL OPTIONS -->

      <div v-for="[id, title] in pollState.vote_options" v-if="pollState.vote_options">
        <div v-if="delegateeVote && delegateeVote.option === id"
             class="mx-4 mb-4 mt-2 p-4 bg-gray-200 text-gray-600 text-sm ae-triangle-after">
          Your <span v-if="!Object.keys(delegateeVote.delegationTree).includes(accountAddress)">sub-</span>delegatee
          <span class="font-mono">{{delegateeVote.account.substr(0,10)}}...</span> has voted with your
          stake for "{{title}}". Unhappy? You can overwrite their choice by placing your own vote.
        </div>
        <div class="m-4 ae-card" @click="showVoters(id)">
          <div class="flex justify-between items-center w-full py-4 px-3">
            <ae-check class="mr-1" v-model="voteOption" :value="id" type="radio" @click.stop.prevent
                      @change="vote(id)" :disabled="isClosed || !accountAddress"></ae-check>
            <!-- TODO find better solution than this -->
            <div class="mr-auto ml-2" style="margin-top: 4px">
              <span
                class="font-bold" v-if="pollVotesState">{{pollVotesState.stakesForOption[id].percentageOfTotal | formatPercent}}</span>
              <span>{{title}}</span>
            </div>
            <div class="min-w-3" style="margin-top: 4px" v-if="pollVotesState">
              <img src="../assets/back_gray.svg" class="transition"
                   :class="{'rotate-90': votersForOption.id != null && votersForOption.id == id}">
            </div>
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
          <AccountTreeLine :balance="voter.stake" :account="voter.account" :delegators="voter.delegators"
                           v-for="voter in votersForOption.voters"
                           :key="voter.account"/>
        </div>
      </div>
      <BottomButtons :cta-text="voteOption !== null && !isClosed ?  'Revoke Vote' : null "
                     @cta="revokeVote"></BottomButtons>
      <CriticalErrorOverlay :error="error" @continue="error = null"></CriticalErrorOverlay>
    </div>
  </div>
</template>

<script>
  import aeternity from "~/utils/aeternity";
  import {AeButton, AeCheck, AeIcon, AeToolbar, AeCard} from '@aeternity/aepp-components/src/components/';
  import pollContractSource from '../../../governance-contracts/contracts/Poll.aes';
  import Backend from "~/utils/backend";
  import BiggerLoader from '../components/BiggerLoader';
  import AeIdentityLight from '../components/AeIdentityLight';
  import BigNumber from 'bignumber.js';
  import BottomButtons from "~/components/BottomButtons";
  import AccountHeader from "~/components/AccountHeader";
  import GrayText from "~/components/GrayText";
  import CriticalErrorOverlay from "~/components/CriticalErrorOverlay";
  import AccountTreeLine from "~/components/AccountTreeLine";

  export default {
    name: 'Home',
    components: {
      AccountTreeLine,
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
        error: null,
        isClosed: false
      };
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

        if (!this.pollVotesState) return;

        const votes = this.pollVotesState.stakesForOption.find(option => option.option === id.toString()).votes;
        const votesAggregation = votes.map(vote => {
          return {
            account: vote.account,
            stake: vote.stake,
            delegators: vote.delegationTree
          };
        });

        this.votersForOption = {
          id: id,
          voters: votesAggregation.sort((a, b) => new BigNumber(b.stake).comparedTo(new BigNumber(a.stake)))
        };
      },
      async loadData() {
        this.pollId = this.$route.params.id;

        this.votersForOption = {};
        if (!aeternity.passive) {
          this.accountAddress = aeternity.address;
          this.balance = await aeternity.client.balance(aeternity.address);
        }

        const poll = await aeternity.contract.methods.poll(this.pollId);
        this.pollAddress = poll.decodedResult.poll;
        this.pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: this.pollAddress});
        this.pollState = (await this.pollContract.methods.get_state()).decodedResult;
        this.isClosed = this.pollState.close_height <= parseInt(await aeternity.client.height());
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
  };
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

  .max-w-75 {
    max-width: 75%;
  }

  .min-w-3 {
    min-width: 1.5rem;
  }

  .ae-triangle-after {
    position: relative;
  }

  .ae-triangle-after::after {
    content: "";
    width: 20px;
    height: 20px;
    border: 10px solid #edf2f7;
    transform: rotate(45deg);
    position: absolute;
    bottom: -10px;
    left: 20px;
  }

</style>
