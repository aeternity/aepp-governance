<template>
  <div>
    <div class="overlay-loader" v-show="showLoading">
      <BiggerLoader></BiggerLoader>
    </div>
    <div @click="$router.push('/')" class="fixed top-0 right-0 p-8">
      <ae-icon name="close" fill="primary" face="round"
               class="ae-icon-size shadow"></ae-icon>
    </div>

    <h1 class="h1">Create Poll</h1>
    <br/>
    <br/>

    <ae-input v-model="createMetadata.title" label="Title"></ae-input>
    <ae-input v-model="createMetadata.description" label="Description"></ae-input>
    <ae-input v-model="createMetadata.link" label="Link"></ae-input>
    <br/>
    <ae-check v-model="createMetadata.is_listed" type="checkbox">
      Should be listed
    </ae-check>
    <br/><br/>
    <ae-input v-model="optionsString" label="Options, separated by ','"></ae-input>
    <br/>
    <ae-input v-model="closeHeightString" label="Close at height or empty"></ae-input>
    <br/>
    <ae-button face="round" fill="primary" extend @click="createPoll()">Create Poll</ae-button>
  </div>
</template>

<script>
    import aeternity from "~/utils/aeternity";
    import {AeIcon, AeButton, AeInput, AeCheck} from "@aeternity/aepp-components";
    import pollContractSource from '../../../governance-contracts/contracts/Poll.aes'
    import BiggerLoader from '../components/BiggerLoader'

    export default {
        name: 'Home',
        components: {AeIcon, AeButton, AeInput, AeCheck, BiggerLoader},
        data() {
            return {
                showLoading: false,
                createMetadata: {
                    title: "",
                    description: "",
                    link: "",
                    is_listed: true,
                },
                optionsString: "",
                closeHeightString: "",
                polls: []
            }
        },
        computed: {},
        methods: {
            async createPoll() {
                if (this.createMetadata.title.length >= 3 && this.optionsString.length >= 3) {
                    this.showLoading = true;
                    const close_height = isNaN(parseInt(this.closeHeightString)) ? Promise.reject() : Promise.resolve(parseInt(this.closeHeightString));
                    const options = this.optionsString.split(',').reduce(({seq, res}, cur) => {
                        console.log("seq", seq, "res", res, "cur", cur)
                        res = Object.assign(res, {[seq]: cur.trim()});
                        return {seq: seq + 1, res: res}
                    }, {seq: 0, res: {}}).res;
                    const pollContract = await aeternity.client.getContractInstance(pollContractSource);
                    console.log(this.createMetadata, options, close_height)
                    const init = await pollContract.methods.init(this.createMetadata, options, close_height);
                    const addPoll = await aeternity.contract.methods.add_poll(init.address);
                    console.log("addPoll", addPoll)


                    this.createMetadata = {
                        title: "",
                        description: "",
                        link: "",
                        is_listed: true,
                    };
                    this.optionsString = ""
                    this.closeHeightString = ""

                    this.$router.push(`/poll/${addPoll.decodedResult}`);
                }
            }
        }
    }
</script>

<style scoped>

</style>
