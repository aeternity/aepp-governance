# How the governance contract works

## Overview

The governance polling system consists of two contracts, one as single-instance deployed registry contracts keeping track of all polls and delegations globally, as well as for each single poll a separate contract keeping track of poll options and account votes. Results from both are combined in global vote counting, delegation information from registry, combined with on-chain balances applied as "delegated weighted" stake for each vote in each poll. Computing the final results can only happen off-chain due to the implied complexity.

## Registry Contract

In the registry contract users can perform two actions:
 - add poll to registry using `add_poll(poll : Poll, is_listed : bool)` 
 - register global stake delegation using
   -  `delegate(delegatee : address)` to register delegation of all stake (for polling only) from current height
   -  `revoke_delegation()` to revoke current delegation from current height

In addition, a few helper methods are exposed to fetch registered registry and delegation information.

## Poll Contract

Each poll creator deploys a new poll contract using `init(metadata : metadata, vote_options : vote_option, close_height : option(int))` where metadata is `{ title : string, description : string, link : string, spec_ref : option(hash)}` and vote options `map(int, string)`.

After deployment any account can participate in polling:
 - `vote(option : int)` to register the stake at height to be counted for the specified option
 - `revoke_vote()` to revoke the current registered option chosen

Those actions can be done until `close_height` has been reached, after this height no further actions are possible.

Additionally, again a few helper methods are exposed to fetch registered poll state information.
