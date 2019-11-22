<template>
  <div class="hidden md:flex" v-if="activeView.items.length > 0 || activeView.headline">
    <div class="h-full border border-b-0 border-t-0 flex justify-center items-center px-2 bg-gray-200 text-gray-600 cursor-pointer" @click="toggleView">
      {{showHints ? ">" : "<"}}
    </div>
    <div class="relative show-hints ae-transition-300" :class="{'hide-hints': !showHints}">
      <h1 class="text-3xl mr-8">{{activeView.headline}}</h1>
      <ExplainerItem v-for="item in activeView.items" :target="item.target" :offset="item.offset" :key="item.target">
        {{item.text}}
      </ExplainerItem>
    </div>
  </div>
</template>

<script>
  import ExplainerItem from "./ExplainerItem";
  import help from '~/assets/help.json'

  export default {
    name: "Explainer",
    components: {ExplainerItem},
    data() {
      return {
        showHints: true,
        activeView: {
          headline: '',
          items: [],
        },
        views: help
      }
    },
    methods: {
      setActiveView(name) {
        this.activeView = this.views.hasOwnProperty(name) ? this.views[name] : {
          headline: '',
          items: []
        };
      },
      toggleView() {
        this.showHints = !this.showHints
      }
    },
    mounted() {
      this.setActiveView(this.$route.name);
      this.$router.afterEach((to) => {
        this.setActiveView(to.name)
      })
    }
  }
</script>

<style scoped>
  .show-hints {
    min-width: 300px;
    max-width: 500px;
    overflow: hidden;
    margin-left: 1rem;
    z-index: 0;
    opacity: 1;
  }

  .hide-hints {
    max-width: 0;
    min-width: 0;
    opacity: 0;
    margin-left: 0;
  }
</style>
