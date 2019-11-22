<template>
  <div class="bg-gray-ae px-6 py-4 w-full text-3xl text-white flex justify-between items-center">
    <slot/>
    <div class="flex items-center justify-end">
      <div ref="inputContainer" class="relative rounded-full hide-input flex items-center pr-3 pb-1"
           v-if="showNumberInput">
        <img src="../assets/hash_white.svg" class="h-6 pl-4 pt-1 cursor-pointer" @click="showInput">
        <form @submit.prevent="submit">
          <input v-model="id" ref="input" type="number" @input="$emit('input', id)"
                 class="text-gray-800 w-full text-2xl outline-none bg-transparent leading-none" @blur="onBlur">
        </form>
      </div>
      <div class="w-8 text-2xl h-8 bg-primary rounded-full justify-center flex items-center ml-2 cursor-pointer"
           @click.stop.prevent="toggleHelp()" id="question-mark-icon">
        ?
      </div>
    </div>

  </div>
</template>

<script>
  export default {
    name: "BlackHeader",
    data() {
      return {
        extended: false,
        id: null,
        activeTimeout: 0
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
        if(this.$route.name !== 'help') this.$router.push('help');
        else this.$router.go(-1);
      }
    },
    beforeDestroy() {
      if (this.activeTimeout) clearTimeout(this.activeTimeout);
    }
  };
</script>

<style scoped>
  .bg-gray-ae {
    background-color: #333333;
    text-transform: capitalize;
  }

  .hide-input {
    width: auto;
    background: #333;
    padding-right: 0;
  }

  .hide-input input {
    width: 0;
  }

  .show-input {
    background: white;
    padding-right: 1.5rem;
  }

  .show-input img {
    filter: brightness(0.2);
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
      background-color: #333;
      padding-right: 0;
    }
    40% {
      background-color: #FFF;
      padding-right: 1.5rem;
    }
    to {
      background-color: #FFF;
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
      filter: brightness(0.2);
    }
    to {
      filter: brightness(0.2)
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
