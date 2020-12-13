<template>
  <div class="ae-input-container" :class="{ focus, error }">
    <div class="ae-input-box">
      <!-- @slot used for defining header section of input -->
      <div class="ae-input-header" v-if="label">
        <label :for="id" class="ae-input-label">
          {{ label }}
        </label>
        <slot name="header" />
      </div>
      <!-- Input tag -->
      <input
        class="ae-input"
        :class="{ aemount }"
        :id="id"
        :value="value"
        @focus="focus = true"
        @blur="(event) => {
        propagateEvent(event);
        focus = false
        }"
        @input="propagateEventValue"
        v-if="!$slots.default && !$scopedSlots.default"
        v-bind="$attrs"
      />
      <!--
        @slot adds the ability to add your own
        custom input elements, if used in combination
        with `scoped slots` (see https://vuejs.org/v2/guide/components-slots.html#Scoped-Slots)
        gives you the parent `context` as a property where
        you can access methods / properties
      -->
      <slot
        :context="this"
        v-else
      />
    </div>
    <!-- @slot footer slot, used for adding elements below the input -->
    <slot name="footer" />
  </div>
</template>
<script>
import { events } from '@aeternity/aepp-components/src/mixins';

export default {
  name: 'ae-input',
  mixins: [events],
  data() {
    return { focus: false };
  },
  props: {
    /**
     * ID of the component/input
     */
    id: String,

    /**
     * Actual input element value
     */
    value: [String, Number],

    /**
     * Property to define label of input, used to set
     * label
     */
    label: String,

    /**
     * Activates the amount state of the component
     */
    aemount: Boolean,

    /**
     * Activates the Address state of the component
     */
    aeddress: Boolean,

    /**
     * Activates error state of the input field
     */
    error: Boolean,
  },
};
</script>
<style lang="scss" scoped>
@import '~@aeternity/aepp-components/src/styles/globals/mixins';
@import '~@aeternity/aepp-components/src/styles/variables/animations';
@import '~@aeternity/aepp-components/src/styles/variables/colors';
@import '~@aeternity/aepp-components/src/styles/placeholders/typography';

.ae-input-container {
  user-select: none;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: 5px;
  overflow: hidden;
  transition: all $base-transition-time;
  border-bottom: 2px solid transparent;
  border-top: 1px solid #141414;
  border-bottom: 1px solid #141414;
 
  &.focus {
    border-top: 1px solid #1161fe;
    border-bottom: 1px solid #1161fe;

    .ae-input-box {
      background: #000;
    }
   }
 
   &.focus .ae-input-label {
    color: #babac0;
   }
 
   &.error {
    border-bottom: 2px solid #ff4746;
    caret-color: #ff4746;
   }
 
   &.error .ae-input-label {
    color: #ff4746;
   }
 
   .ae-input-label:after,
   .ae-input-label:after {
     content: '*';
    color: #ff4746;
   }
 }
 
.ae-input-box {
  display: flex;
  flex-direction: column;
  background: #141414;
  height: 3.75rem;
}
 
.ae-input-header {
  position: relative;
  display: flex;
  flex: 0 0;
  justify-content: space-between;
  align-items: center;
  align-self: flex-start;
  width: 100%;
  padding: 0.5rem 1rem 0 1rem;
}

.ae-input-label {
  @extend %face-sans-xs;
 
  color: #787878;
 }
 
 .ae-input {
  @extend %face-sans-base;

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
  
  &::placeholder {
    color: #BABAC0;
    opacity: 1; /* Firefox */
  }

  &:-ms-input-placeholder {
    color: #BABAC0;
  }
 
  align-self: center;
  color: #fff;
  justify-self: center;
  flex: 0 1 100%;
  width: 100%;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.875rem;
 
   &:only-child {
     flex: 1 0;
   }

  &:focus {
    &::placeholder {
      color: #fff;
      opacity: 1; /* Firefox */
    }

    &:-ms-input-placeholder {
      color: #fff;
    }
  }
}

.ae-input.aemount {
  @extend %face-mono-xl;

  text-align: center;
  line-height: 1;
  font-weight: 300;
}
</style>
