<template>
  <div class="h-64 relative">
    <h1 class="text-3xl mr-8">Sample Headline</h1>
    <ExplainerItem target="#home-tab-switcher">
      Switch tabs here.
    </ExplainerItem>
  </div>
</template>

<script>
  import ExplainerItem from "./ExplainerItem";
  export default {
    name: "Explainer",
    components: {ExplainerItem}
  }
</script>

<style scoped>

</style>
