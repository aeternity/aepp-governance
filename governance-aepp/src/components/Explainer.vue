<template>
  <div class="flex" v-if="activeView.items.length > 0 || activeView.headline">
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
        views: {
          'home': {
            headline: 'The Governance Aepp',
            items: [
              {target: '#home-tab-switcher', offset: 0, text: 'Switch tabs to filter and/or sort the listed polls.'},
              {target: '#home-poll-list', offset: 20, text: 'For each poll a quick summary is displayed. For more information click on one of the polls.'},
              {target: '#home-nav-buttons', offset: 0, text: 'Use the bottom buttons to navigate around the aepp.'}
            ]
          },
          'poll': {
            headline: 'The Poll Page',
            items: [
              {target: '#poll-description', offset: 0, text: 'The poll title, description and link are a description and extension of the question.'},
              {target: '#poll-author', offset: 0, text: 'The account that introduced the vote to the blockchain.'},
              {target: '#poll-options', offset: 20, text: 'To cast your vote in this poll, select a check mark or click on the option for more details.'},
              {target: '#poll-nav-buttons', offset: 0, text: 'Use the bottom buttons to navigate around the aepp.'}
            ]
          },
          'account': {
            headline: 'The Account Page',
            items: [
              {target: '#account-summary', offset: 50, text: 'The accounts address, its stake and the delegated stake are display in the account summary.'},
              {target: '#account-delegatee', offset: 15, text: 'The account from the summary has delegated its stake to this account.'},
              {target: '#account-tab-delegations', offset: 20, text: 'All accounts that delegated their stake to this account are listed here.'},
              {target: '#account-tab-votes', offset: 20, text: 'All votes that this account or any delegated account casted are listed here.'},
              {target: '#account-tab-polls', offset: 20, text: 'All polls that this account authored are listed in this tab.'},
              {target: '#account-nav-buttons', offset: 0, text: 'Use the bottom buttons to navigate around the aepp.'}
            ]
          }
        }
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
