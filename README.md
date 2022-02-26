
# Stop the Bus

<img src=https://user-images.githubusercontent.com/1243909/85988386-38d49680-b9ef-11ea-98b9-7c3dfac62f1b.png width=400 />

Sort of like Stadt Land Fluss, or Scattergories.

Choose some categories and think of a word for each one, with the given letter.

## How to play

1. Visit the [homepage](https://stopthebus.xyz) and click ”Create game”.
2. Invite some friends to the game. Share the URL with them, or the game ID to enter on the homepage.
3. Add a nickname, and select some or type in some categories to play with.
4. Click ”Start game”
5. A random letter will be chosen; fill in answers beginning with the letter. 
   If you selected ”extra points for alliteration”, answers like “Tina Turner” will score one point for each word beginning with the letter.
6. Finish the round as fast as possible and then vote up or down for answers
7. Have fun


## Rules

1. Do not add movies or books etc that you do not know and cannot describe.
2. Specificity is important. For cities add Washington D.C., not Washington
3. TBD


## Project usage

```
git clone https://github.com/alexbassy/stopthebus.git
cd stopthebus
yarn
yarn dev
```

### Cloudflare worker

Cloudflare worker routes live in `/src/workers` and can be built with `yarn worker:build` and published with `yarn worker:publish`