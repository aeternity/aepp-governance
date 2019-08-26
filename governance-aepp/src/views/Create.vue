<template>
  <div>
    <div class="overlay-loader" v-show="showLoading">
      <BiggerLoader></BiggerLoader>
    </div>
    <BlackHeader>
      Create Poll
    </BlackHeader>
    <GrayText>
      Use the form below to create a new governance poll.
    </GrayText>
    <div class="py-2 px-4">
      <ae-input v-model="createMetadata.title" label="Title"></ae-input>
    </div>
    <div class="py-2 px-4">
      <ae-input v-model="createMetadata.description" label="Description"></ae-input>
    </div>
    <div class="py-2 px-4">
      <ae-input v-model="createMetadata.link" label="Link"></ae-input>
    </div>
    <div class="py-2 px-4">
      <AeButtonGroup>
        <ae-button face="round" @click="is_listed = true" :fill="is_listed ? 'primary' : 'neutral'">Publicly Listed
        </ae-button>
        <ae-button face="round" @click="is_listed = false" :fill="is_listed ? 'neutral' : 'primary'">Not Listed
        </ae-button>
      </AeButtonGroup>
    </div>

    <div class="my-2 mx-4 flex items-center bg-white px-4" v-for="option in options">
      <div class="w-6 flex justify-center">
        <div v-if="option.text" class="rounded-full border border-gray-500 w-6 h-6">&nbsp;</div>
        <div v-else class="text-3xl text-gray-300 text-right font-bold">&plus;</div>
      </div>
      <input v-model="option.text" @input="optionInput" type="text" placeholder="Add Option"
             class="ae-input-option w-full h-full px-2 py-6 outline-none"/>
      <div v-if="option.text">
        <div class="text-2xl text-gray-500 text-right" @click="removeOption(option.id)">&times;</div>
      </div>
    </div>

    <div class="py-2 px-4 mb-16">
      <ae-input type="number" v-model="closeHeightString" label="Close at height or empty"></ae-input>
      <div class="text-gray-500 text-sm p-2">
        Current height is {{height}}
        <span v-if="closeDate">
          and height {{closeHeightString}} is expected at {{closeDate}}
        </span>
        <span v-if="closeHeightString && closeHeightString < height">
          and closing height {{closeHeightString}} lies in the past.
        </span>
      </div>
    </div>
    <BottomButtons back="/" :account="address" cta-text="Create Poll" :cta-action="createPoll"></BottomButtons>
  </div>
</template>

<script>
  import aeternity from "~/utils/aeternity";
  import {AeIcon, AeButton, AeInput, AeCheck, AeButtonGroup} from "@aeternity/aepp-components/src/components";
  import pollContractSource from '../../../governance-contracts/contracts/Poll.aes'
  import BiggerLoader from '../components/BiggerLoader'
  import BottomButtons from "~/components/BottomButtons";
  import BlackHeader from "~/components/BlackHeader";
  import GrayText from "~/components/GrayText";

  export default {
    name: 'Home',
    components: {GrayText, BlackHeader, BottomButtons, AeIcon, AeButton, AeInput, AeCheck, BiggerLoader, AeButtonGroup},
    data() {
      return {
        showLoading: false,
        createMetadata: {
          title: "",
          description: "",
          link: "",
        },
        is_listed: true,
        optionsString: "",
        closeHeightString: "",
        polls: [],
        address: null,
        options: [{
          id: 0,
          text: ''
        }],
        nextId: 1,
        height: 0
      }
    },
    computed: {
      closeDate() {
        if (this.closeHeightString - this.height > 0) {
          return new Date(Date.now() + (this.closeHeightString - this.height) * 3 * 60 * 1000)
        }
        return null
      }
    },
    methods: {
      async createPoll() {
        if (this.createMetadata.title.length >= 3 && this.options.length >= 3) {
          this.showLoading = true;
          const close_height = isNaN(parseInt(this.closeHeightString)) ? Promise.reject() : Promise.resolve(parseInt(this.closeHeightString));

          let newID = 0;
          const options = this.options.filter(option => !!option.text)
            .map(option => {
              option.id = newID++;
              return option
            }).reduce((acc, option)=> Object.assign(acc, {[option.id]: option.text}), {});

          const pollContract = await aeternity.client.getContractInstance(pollContractSource);
          const init = await pollContract.methods.init(this.createMetadata, options, close_height);
          const addPoll = await aeternity.contract.methods.add_poll(init.address, this.is_listed);
          this.$router.push(`/poll/${addPoll.decodedResult}`);
        }
      },
      optionInput(event) {
        if (this.options[this.options.length - 1].text) {
          const nextID = ++this.nextId;
          this.options.push({
            id: nextID,
            text: ''
          });
        }
        if (this.options.length > 1 && !this.options[this.options.length - 2].text) {
          this.options.pop()
        }
      },
      removeOption(id) {
        this.options = this.options.filter(option => option.id !== id);
      }
    },
    async created() {
      await aeternity.initClient();
      this.address = aeternity.address;
      this.height = aeternity.height;
    }
  }
</script>

<style>
  input.ae-input-option {
    font-size: 1.0625rem;
    line-height: 1.5rem;
    font-family: Inter UI, sans-serif;
  }
  .ae-input-box {
    background-color: #fff !important;
  }
</style>
