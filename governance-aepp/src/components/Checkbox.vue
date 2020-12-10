<template>
  <label class="ae-check">
    <input
      :id="id"
      :type="type"
      :name="name"
      :value="value"
      :checked="isChecked"
      :disabled="disabled"
      @change="change">
    <span class="ae-check-button">
      <slot />
    </span>
  </label>
</template>

<script>
export default {
  name: 'ae-check',
  model: {
    prop: 'checked',
    event: 'change',
  },
  props: {
    /**
     * ID of the component/input
     */
    id: String,
    /**
     * Name of component
     */
    name: String,
    /**
     * value of component
     */
    value: { type: [String, Number, Boolean], default: undefined },
    checked: { type: [Array, String, Number, Boolean], default: false },
    /**
     * Define the type of the input
     */
    type: {
      type: String,
      default: 'checkbox',
    },
    /**
     * Puts the component in disabled state
     */
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    isChecked() {
      return Array.isArray(this.checked)
        ? this.checked.includes(this.value)
        : this.checked === this.value || this.checked === true;
    },
  },
  methods: {
    change(event) {
      let newValue;
      if (this.value === undefined) newValue = event.target.checked;
      else if (this.type === 'radio' || !Array.isArray(this.checked)) newValue = this.value;
      else {
        newValue = event.target.checked
          ? [...this.checked, this.value]
          : this.checked.filter(c => c !== this.value);
      }
      this.$emit('change', newValue);
    },
  },
};
</script>
<style lang="scss" scoped>
@import '~@aeternity/aepp-components/src/styles/globals/functions';
@import '~@aeternity/aepp-components/src/styles/variables/colors';
@import '~@aeternity/aepp-components/src/styles/variables/animations';
@import '~@aeternity/aepp-components/src/styles/variables/typography';
@import '~@aeternity/aepp-components/src/styles/placeholders/typography';

.ae-check {
  user-select: none;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;

  > input[type="radio"],
  > input[type="checkbox"] {
    display: none;
    visibility: hidden;
  }

  > input[type="radio"]:checked + .ae-check-button:before,
  > input[type="checkbox"]:checked + .ae-check-button:before {
    background: $color-primary;
    border-color: $color-primary;
  }

  > input[type="radio"]:checked + .ae-check-button:after,
  > input[type="checkbox"]:checked + .ae-check-button:after {
    opacity: 1;
  }

  > input[type="radio"]:disabled + .ae-check-button:before,
  > input[type="checkbox"]:disabled + .ae-check-button:before {
    background: $color-neutral-positive-1;
    border-color: $color-neutral-positive-2;
  }

  > input[type="radio"]:disabled + .ae-check-button,
  > input[type="checkbox"]:disabled + .ae-check-button {
    cursor: not-allowed;
  }
}

.ae-check-button {
  @extend %face-sans-base;

  position: relative;
  display: inline-flex;
  align-items: center;
  padding-left: 2rem;
  min-width: 2rem;
  min-height: 1.5rem;
  transition: all $base-transition-time;

  &:before, &:after {
    position: absolute;
    display: inline-block;
    content: ' ';
    top: 0;
    bottom: 0;
    left: 4px;
    transition: all $base-transition-time;
  }

  &:before {
    background: $color-white;
    border: 2px solid $color-neutral-positive-1;
    border-radius: 50%;
    box-shadow: 0 0 16px $color-shadow-alpha-15;
    width: 24px;
    height: 24px;
  }

  &:after {
    background-size: 0.75rem;
    opacity: 0;
    width: 24px;
    height: 24px;
  }
}

/* Overrides */
span.ae-check-button.ae-check-button::after {
  background: none;
  left: 0.75rem;
  top: 0.1875rem;
  width: 0.5rem;
  height: 0.875rem;
  border: solid #00FF9D;
  border-width: 0 0.125rem 0.125rem 0;
  transform: rotate(45deg);
}

span.ae-check-button.ae-check-button::before {
  border-radius: 0.125rem 0.4375rem 0.125rem 0.4375rem;
  background: #141414 !important;
  border: 0.125rem solid #141414 !important;
}

.ae-check.ae-check.ae-check > input[type="radio"]:checked + .ae-check-button:before,
.ae-check.ae-check.ae-check > input[type="radio"]:disabled + .ae-check-button:before {
  background: #141414 !important;
  border-color: #141414 !important;
}

.ae-check.ae-check.ae-check > input[type="radio"]:disabled + .ae-check-button:before {
  opacity: 0.6;
}
</style>
