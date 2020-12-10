<template>
  <div class="black-header py-1 px-3 sm:px-4 w-full text-xl flex justify-between items-center bg-black-200 text-blue font-medium">
    <slot/>
    <div class="flex items-center justify-end">
      <div ref="inputContainer" class="relative rounded hide-input flex items-center pr-3 pb-1"
           v-if="showNumberInput">
        <img src="../assets/hash.svg" class="h-6 pl-4 pt-1 cursor-pointer" @click="showInput" alt="enter id">
        <form @submit.prevent="submit">
          <input v-model="id" ref="input" type="number" @input="$emit('input', id)"
                 class="text-gray-600 w-full text-xl outline-none bg-transparent leading-none" @blur="onBlur">
        </form>
      </div>
      <div class="w-6 text-xl h-6 justify-center flex items-center ml-2 cursor-pointer"
           @click.stop.prevent="toggleHelp()" id="question-mark-icon">
          <SmallButton 
            :img="helpIcon" 
            :hoverImg="helpIconActive"
          />
      </div>
    </div>

  </div>
</template>

<script>
  import SmallButton from "./SmallButton";
  import helpIcon from "../assets/help.svg";
  import helpIconActive from "../assets/helpActive.svg";

  export default {
    name: "BlackHeader",
    components: {SmallButton},
    data() {
      return {
        extended: false,
        id: null,
        activeTimeout: 0,
        helpIconActive,
        helpIcon
      };
    },
    props: {
      'showNumberInput': {
        type: Boolean,
        default: false
      }
    },
    methods: {
      submit() {
        this.$refs.input.blur();
        this.$emit('submit', this.id);
      },
      onBlur() {
        this.$refs.inputContainer.classList.add('hide-input-animation');
        this.activeTimeout = setTimeout(() => {
          this.$refs.inputContainer.classList.remove('show-input', 'hide-input-animation');
          this.extended = false;
          this.id = null;
        }, 600);
      },
      showInput() {
        if (this.extended) return;
        this.extended = true;
        this.$refs.inputContainer.classList.add('show-input-animation');
        this.activeTimeout = setTimeout(() => {
          this.$refs.inputContainer.classList.add('show-input');
          this.$refs.inputContainer.classList.remove('show-input-animation');
        }, 600);
        this.$refs.input.focus();
      },
      toggleHelp() {
        if(this.$route.name !== 'help') this.$router.push('/help');
        else this.$router.go(-1);
      }
    },
    beforeDestroy() {
      if (this.activeTimeout) clearTimeout(this.activeTimeout);
    }
  };
</script>

<style scoped>
  .black-header {
    line-height: 3.25rem;
    letter-spacing: 0.1rem;
  }

  .hide-input {
    width: auto;
    padding-right: 0;
  }

  .hide-input input {
    width: 0;
  }

  .show-input {
    padding-right: 1.5rem;
    background: #12121b;
  }

  .show-input img {
    filter: brightness(0.6);
  }

  .show-input input {
    width: 3rem;
  }

  .show-input-animation {
    animation: background-frames 500ms forwards;
  }

  .show-input-animation img {
    animation: add-filter-frames 500ms forwards;
  }

  .show-input-animation input {
    animation: show-input-frames 500ms forwards;
  }

  .hide-input-animation {
    animation: background-frames 500ms forwards;
    animation-direction: reverse;
  }

  .hide-input-animation img {
    animation: add-filter-frames 500ms forwards;
    animation-direction: reverse;
  }

  .hide-input-animation input {
    animation: show-input-frames 500ms forwards;
    animation-direction: reverse;
  }

  @keyframes background-frames {
    from {
      background-color: #0f0f0f;
      padding-right: 0;
    }
    40% {
      background-color: #12121b;
      padding-right: 1.5rem;
    }
    to {
      background-color: #12121b;
      padding-right: 1.5rem;
    }
  }

  @keyframes show-input-frames {
    from {
      width: 0;
    }
    to {
      width: 3rem;
    }
  }

  @keyframes add-filter-frames {
    from {
      filter: brightness(1);
    }
    40% {
      filter: brightness(0.6);
    }
    to {
      filter: brightness(0.6)
    }
  }

  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type=number] {
    -moz-appearance: textfield;
  }
</style>
