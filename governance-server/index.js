const aeternity = require("./src/aeternity");

const test = async () => {
    const data = await aeternity.pollVotesState("ak_vGKZPqdXgWAQon5wdG8P1hKgcKE31VWc2rWK5jCswZKiJRQpG");
    console.log(data);
};

test();
