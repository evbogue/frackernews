# Fracker News

### a social layer and local caching of hacker news comments and stories

Try it: https://frackernews.deno.dev/

##### Why?

Oh Hackernews, HN, news.ycombinator.com, that news platform with the comments that I'm slightly ashamed to admit that I've been repeatedly checking almost every day for ten+ years. 

I realized when hn went down for a bit that I still wanted to read the comments even when it was down, so I hacked up a little JavaScript that caches the comments in the frontend using [IdbKVStore](https://github.com/xuset/idb-kv-store) and then renders them up in the DOM using [hscrpt](https://github.com/dominictarr/hscrpt).

Then while I was at it I added a way to follow/unfollow your favorite comment makers so you can see when someone posts who you enjoy.

##### How?

The script fetches stories using the [Hacker News API](https://github.com/HackerNews/API) and reads them into an infinite scroller. If you already have the story, then it does not fetch it again to avoid hitting the API repeatedly.

##### Roadmap

There are a few things that bug me about how this works, but since this is a one-off project that I built just for myself I'll probably only fix them when I get very annoyed by them. If you want to fix any bugs you're welcome to fix them and then send a patch.

Questions? [ev@evbogue.com](mailto:ev@evbogue.com)

---
MIT
