<template>
  <div class="mx-4 mb-4 mt-2 p-4 bg-gray-200 text-gray-600 text-sm ae-triangle-after">
    <slot />
  </div>
</template>

<script>
  export default {
    name: "HintBubble"
  }
</script>

<style scoped>

  .ae-triangle-after {
    position: relative;
  }

  .ae-triangle-after::after {
    content: "";
    width: 1.25rem;
    height: 1.25rem;
    border: 0.625rem solid #edf2f7;
    transform: rotate(45deg);
    position: absolute;
    bottom: -0.625rem;
    left: 1.25rem;
  }
</style>
