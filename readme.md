# Keybound

## Description
Legends of Runeterra but with the APM of a pro Ryze player.

This app will let you play Legends of Runeterra using a keyboard, adding shortcuts for all major actions, so that people who can't/don't want to use a mouse can play (card games aren't nice to play on trackpad).

## Using the app
Each action has a key associated with it, with additional input for targets to complete the command. As you type the command out, it will becom visible on the overlay. Pressing backspace will remove the most recent input and pressing "esc" will clear the command buffer and cancel any partially running commands. If an invalid command/argument is pressed, the buffer will remove it automatically. The app will only register inputs if Legends of Runeterra or the app overlay is the active window.

#### Locations
When running a command, you will sometimes need to specify which specific location to use. Each location has a relevant keybinging, listed below:

* **local** ('l'): your side of the board

* **opponent** ('o'): your opponent's side of the board

* **board** ('b'): cards that are attacking/blocking

* **active** ('a'): cards that are summoned, but not attacking/blocking

* **hand** ('h'): cards that are in hand

* **face** ('f'): the nexus

* **deck** ('d'): the deck

* **spells** ('s'): the spell zone

Cards in each location are numberer 1-0 from left-to-right.

#### Commands
The commands, with their keybindings and descriptions, are listed below:

* **play** ('p'): plays a card from hand. If a card targets other cards when played, these targets are given as arguments. The app will remove invalid target locations, so you only need to consider the possible targets (e.g. Ki Burst targets a card in your hand, so you don't need to include 'l'/'o' or 'h', just a number. Mystic Shot targets anything, so you need to specify 'l'/'o', 'b'/'a'/'f', and a number - if not targeting face.) A card being played will not count as a card in hand when targeting.
[Example](https://imgur.com/Vsnpq1q.gif)

* **attack** ('a'): move a card from your active to board to attack. You can add one card at a time with a number, or press 'a' again to attack with everything.
[Example](https://imgur.com/9Zrdp9j.gif)
![all_attack](https://imgur.com/8UHnBck.gif)

* **challenge** ('c'): move a card from your opponent's active to block one of your minions on board. The first argument is the number for your opponent's card, the second is the number for your card.
![challenge](https://imgur.com/I8LO841.gif)

* **block** ('b'): move a card from your active to block one of your opponent's minions on board. The first argument is the number for your card, the second is the number of your opponent's card.
[Block](https://imgur.com/iYHUhPa.gif)

* **end phase** ('ss'): presses the big round button that ends your actions for the current phase.

* **mulligan** ('m'): marks/unmarks a card to be replaced at the start of the game, argument is the number of the card to be replaced.
[Mulligan](https://imgur.com/1MlCN47.gif)

* **remove** ('r'): removes a spell/minion from your board. First argument is the location (spell zone/board), second is the number of the card to be removed.
[Remove](https://imgur.com/6IVzEYp.gif)

* **inspect** ('i'): brings up the detailed view for a card/deck. First argument is the side of the board ('l'/'o'), second argument is the area ('b'/'a'/'d'/'h'), third argument is the number of the card (not necessary for inspecting decks), left and right arrow keys can be used to look at associated cards.
[Inspect](https://imgur.com/hu65UJk.gif)

* **surrender** ('qq'): fastest concede in the West.
![fastest concede in the West](https://imgur.com/69O8DfI.gif)

* **close** ('ctrl + c'): closes the keybound app.

## Installation
Download the zip file, extract and run "keybound.exe". You can also clone the app, run `npm install` then `node keytracker.js`. Node 8 is currently needed to run the app if done this way.

## Compatibility
The .zip file currently only contains a Windows executable. If run using node, it is (in thoery) compatible with MacOS and Linux as well.

The app is tested on a 1080p monitor (1440p is known to not work) and requires Legends of Runeterra to be run in fullscreen.

## Known issues
* Some commands fail when selecting targets. This can often occur if commands are entered too quickly. If this occurs, press "esc" key to cancel the current command and try again.
* Cards will ask for targets even if no more are available. Current workaround is to press "esc" when all valid targets are selected; the card will still be played.

## Further plans
* Config - Let users set their own keybindings
* Better overlay - due to a compatibility issue in dependencies, the overlay can't properly interact with the app.
Once fixed, overlay can include: highlighting required locations, faster keylogging, hiding when LoR is not active etc.
* Menu controls - full menu navigation and deckbuilding.
* Better target validation - check if target can actually be targeted by an effect (some of this will depend on updates to Riot's API)
* An API for actions - let other developers use this to make other apps that use automating actions (e.g. remote play/Twitch plays)
* Code fixing & refactoring - make it look less like somebody fed alphabet soup into autocorrect

## Questions/comments
* Is this unfair?

   I am not aware of any combos in LoR that are heavily APM dependant; if one should ever exist I will look into restricting the speed of inputs in the app.
  
* I found a problem with the app!

   First, make sure this isn't already a known issue. You can flag up an issue on Github or message me directly and I will look into it. Try to make the description as clear as possible, (what you were doing when it happened, cards involved) it makes fixing things faster.
   
* App is bad and so are you.
   
   Thanks for noticing. Not really sure what you want here.
   
## Legal bits
Keybound was created under Riot Games' [Legal Jibber Jabber](https://www.riotgames.com/en/legal) policy using assets owned by Riot Games.  Riot Games does not endorse or sponsor this project.