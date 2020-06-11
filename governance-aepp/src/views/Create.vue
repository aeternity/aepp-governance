<template>
  <div>
    <div class="overlay-loader" v-show="showLoading">
      <BiggerLoader/>
    </div>
    <BlackHeader>
      Create Poll
    </BlackHeader>
    <div class="text-gray-500 font-bold px-5 py-4">
      Please fill in all the fields below.
    </div>
    <div v-if="Object.values(this.errors).some(val => !!val)" class="bg-ae-error mx-4 p-2 my-2">
      <div class="flex mb-1">
        <div class="text-4xl font-bold pl-1 pr-3 leading-none flex items-center">
          !
        </div>
        <div>
          <span class="font-bold">Hey there is a problem!</span> Check the
          red fields below and try again.
        </div>
      </div>
      <ul class="block ml-6 pl-1">
        <li :key="error" v-for="error in Object.values(this.errors).filter(e => e)" class="list-disc">
          {{error}}
        </li>
      </ul>
    </div>
    <div class="py-2 px-4">
      <ae-input :error="!!errors.titleError" v-model="createMetadata.title" label="Title"
                placeholder="Please make it clear and concise">
      </ae-input>
    </div>
    <div class="py-2 px-4">
      <ae-input :error="!!errors.descriptionError" v-model="createMetadata.description" label="Description"
                placeholder="Please provide more info for other users">
      </ae-input>
    </div>
    <div class="mt-2">
      <HintBubble v-if="showForumHint">
        For easier discussions on your proposal we suggest you create a thread in the æternity forum and link it here.
        (<a href="https://forum.aeternity.com" target="_blank">https://forum.aeternity.com</a>)
      </HintBubble>
    </div>
    <div class="pb-2 px-4">
      <ae-input :error="!!errors.linkError" v-model="createMetadata.link" label="Link" @blur="linkBlurHandler"
                placeholder="If this vote is related to a forum post or paper, please add the link here">
      </ae-input>
    </div>
    <div class="py-2 px-4 flex justify-center">
      <AeButtonGroup>
        <ae-button face="round" @click="is_listed = true" :fill="is_listed ? 'primary' : 'neutral'">Publicly Listed
        </ae-button>
        <ae-button face="round" @click="is_listed = false" :fill="is_listed ? 'neutral' : 'primary'">Not Listed
        </ae-button>
      </AeButtonGroup>
    </div>

    <div class="text-gray-500 font-bold px-5 py-4">
      Poll options
    </div>
    <div class="my-2 mx-4 flex items-center item-options px-4" :class="{'bg-ae-error': !!errors.optionError}"
         :key="option.id" v-for="option in options">
      <div class="w-6 flex justify-center">
        <div v-if="option.text" class="rounded-full border-2 border-gray-500 w-6 h-6">&nbsp;</div>
        <img v-else src="../assets/plus-option.svg" id="plus-icon" alt="add option">
      </div>
      <label>
        <input v-model="option.text" @input="optionInput" type="text" placeholder="Add Option"
               class="ae-input-option w-full h-full px-2 py-6 outline-none"
               :class="{'bg-ae-error': !!errors.optionError}"/>
      </label>
      <div v-if="option.text">
        <div class="text-2xl text-gray-500 text-right remove-button" @click="removeOption(option.id)">&times;</div>
      </div>
    </div>

    <div class="text-gray-500 font-bold px-5 py-4">
      Poll ending
    </div>
    <div class="py-2 px-4 mb-16">
      <ae-input :error="!!errors.closeHeightError" type="number" v-model="closeHeight" @input="updateDateInputs"
                label="Close at height">
      </ae-input>
      <div class="mt-4 flex">
        <ae-input type="date" class="mr-2" label="Est. close date" v-model="dateString"
                  @input="updateCloseHeight"/>
        <ae-input type="time" label="Est. close time" v-model="timeString" @input="updateCloseHeight"/>
      </div>
      <div class="text-gray-500 text-sm p-2">
        <span v-if="closeHeight && closeHeight > height">
          To create a poll that runs infinitely, set "Close at height" to 0.
        </span>
        <span v-if="closeHeight && closeHeight < height && closeHeight !== '0'">
          Current height is {{height}} and closing height {{closeHeight}} lies in the past.
        </span>
        <span v-if="closeHeight === '0'">
          This poll will run infinitely.
        </span>
      </div>
    </div>
    <BottomButtons cta-text="Create Poll" @cta="createPoll"/>
    <CriticalErrorOverlay :error="criticalError" @continue="criticalError = null"/>
  </div>
</template>

<script>
  import '@aeternity/aepp-components/dist/ae-button/ae-button.css';
  import AeButton from '@aeternity/aepp-components/dist/ae-button/';
  import '@aeternity/aepp-components/dist/ae-button-group/ae-button-group.css';
  import AeButtonGroup from '@aeternity/aepp-components/dist/ae-button-group/';

  import aeternity from '../utils/aeternity';
  import pollContractSource from '../assets/contracts/Poll.aes';
  import BiggerLoader from '../components/BiggerLoader';
  import BottomButtons from '../components/BottomButtons';
  import BlackHeader from '../components/BlackHeader';
  import CriticalErrorOverlay from '../components/CriticalErrorOverlay';
  import AeInput from '../components/AeInput';
  import HintBubble from '../components/HintBubble';

  export default {
    name: 'Home',
    components: {
      CriticalErrorOverlay,
      HintBubble,
      BlackHeader, BottomButtons, AeButton, AeInput, BiggerLoader, AeButtonGroup
    },
    data() {
      return {
        showLoading: false,
        showForumHint: false,
        createMetadata: {
          title: "",
          description: "",
          link: "",
          spec_ref: undefined
        },
        is_listed: true,
        optionsString: "",
        closeHeight: 0,
        polls: [],
        options: [{
          id: 0,
          text: ''
        }],
        nextId: 1,
        height: 0,
        heightTimestamp: 0,
        dateString: '',
        timeString: '',
        criticalError: null,
        errors: {
          titleError: null,
          descriptionError: null,
          linkError: null,
          optionError: null,
          closeHeightError: null
        }
      };
    },
    computed: {
      closeDate() {
        if (this.closeHeight - this.height > 0) {
          return new Date(Date.now() + (this.closeHeight - this.height) * 3 * 60 * 1000);
        }
        return null;
      },
    },
    methods: {
      linkBlurHandler() {
        this.showForumHint = this.createMetadata.link ? this.createMetadata.link.indexOf('forum.aeternity.com') === -1 : false;
      },
      leftPad(num) {
        return String("0" + num).slice(-2);
      },
      updateCloseHeight() {
        const closeHeight = Math.round((new Date(`${this.dateString} ${this.timeString}`).getTime() - this.heightTimestamp) / 1000 / 60 / 3) + this.height;
        this.closeHeight = closeHeight < 0 ? 0 : closeHeight;
      },
      updateDateInputs() {
        if (this.closeDate) {
          this.dateString = `${this.closeDate.getFullYear()}-${this.leftPad(this.closeDate.getMonth() + 1)}-${this.leftPad(this.closeDate.getDate())}`;
          this.timeString = `${this.leftPad(this.closeDate.getHours())}:${this.leftPad(this.closeDate.getMinutes())}`;
        } else {
          this.dateString = '';
          this.timeString = '';
        }
      },
      async createPoll() {
        this.errors = {
          titleError: null,
          descriptionError: null,
          linkError: null,
          optionError: null,
          closeHeightError: null
        };

        // VERIFY INPUT
        this.createMetadata.title = this.createMetadata.title.trim();
        if (this.createMetadata.title.length === 0) this.errors.titleError = 'Please provide a title.';
        if (this.createMetadata.title.length > 50) this.errors.titleError = 'Your title is too long (50 chars max).';

        this.createMetadata.description = this.createMetadata.description.trim();
        if (this.createMetadata.description.length === 0) this.errors.descriptionError = 'Please provide a description.';

        this.createMetadata.link = this.createMetadata.link.trim();
        if (this.createMetadata.link.indexOf('http') === -1) this.errors.linkError = 'Your link must include http:// or https://.';
        if (this.createMetadata.link.length === 0) this.errors.linkError = 'Please provide a link.';

        let options = this.options.filter(option => !!(option.text.trim()));
        if (options.length < 2) this.errors.optionError = 'Please provide at least two options.';

        if (this.closeHeight.length === 0) this.errors.closeHeightError = 'Please provide a closing height.';
        else if (isNaN(parseInt(this.closeHeight))) this.errors.closeHeightError = 'The closing height is not a whole number.';
        else if (parseInt(this.closeHeight) <= this.height && this.closeHeight !== "0") this.errors.closeHeightError = 'The closing height lies in the past.';

        if (Object.values(this.errors).some(val => !!val)) return document.querySelector('.wrapper').scrollTo(0, 0);

        // SUBMIT

        if (this.createMetadata.title.length >= 3 && this.options.length >= 3) {
          this.showLoading = true;
          const close_height = parseInt(this.closeHeight) === 0 ? undefined : parseInt(this.closeHeight);
          let newID = 0;
          options = this.options.filter(option => !!option.text)
            .map(option => {
              option.id = newID++;
              return option;
            }).reduce((acc, option) => Object.assign(acc, {[option.id]: option.text}), {});

          try {
            const pollContract = await aeternity.client.getContractInstance(pollContractSource);
            const init = await pollContract.methods.init(this.createMetadata, options, close_height);
            const addPoll = await aeternity.contract.methods.add_poll(init.address, this.is_listed);
            this.$router.push(`/poll/${addPoll.decodedResult}`);
          } catch (e) {
            this.showLoading = false;
            this.criticalError = 'Could not create your poll. Please try again.';
            if (typeof e === 'string')
              this.criticalError += ` Error: ${e}`;
            console.error(e);
          }

        }
      },
      optionInput() {
        if (this.options[this.options.length - 1].text) {
          const nextID = ++this.nextId;
          this.options.push({
            id: nextID,
            text: ''
          });
        }
        if (this.options.length > 1 && !this.options[this.options.length - 2].text) {
          this.options.pop();
        }
      },
      removeOption(id) {
        this.options = this.options.filter(option => option.id !== id);
      }
    },
    async created() {
      await aeternity.initClient();
      this.height = await aeternity.client.height();
      this.heightTimestamp = Date.now();
      this.closeHeight = 20 * 24 * 30 + this.height;
      this.updateDateInputs();
    }
  };
</script>

<style scoped type="text/scss">
  @import '../theme/ae-button.scss';

  .item-options {
    background: #292B35;
    border-radius: 5px;
  }

  input.ae-input-option {
    background: #292B35;
    color: #fff;
    font-size: 1.0625rem;
    line-height: 1.5rem;
  }

  #plus-icon {
    align-items: center;
    color: #67F7B8;
    display: flex;
    font-family: sans-serif;
    font-size: 20px;
    font-weight: 700;
    justify-content: center;
    line-height: 1px;
  }

  .remove-button {
    cursor: pointer;
  }

  .bg-ae-error {
    /* color: #ff0d0d; */
    color: #ff0d0d;
  }

  .bg-ae-error .text-gray-500 {
    color: #ff0d0d;
  }

  .bg-ae-error .border-gray-500 {
    border-color: #ff0d0d;
  }

</style>
