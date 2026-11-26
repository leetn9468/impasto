# Impasto

An oil-painted skin for Claude Code. It puts a thick-paint landscape behind the conversation, in the manner of Van Gogh, and recolours the interface to match. Six scenes share one composition: a swirling sky with one great light, a far shore, and a river of light winding down to where a small angel Claude floats, keeping a slip of your code on a thread.

The skin is a picture and nothing more. It never reads, changes or sends your files, your prompts or your code. The slip of code in the painting is painted too.

## Scenes

| Command | Scene |
| --- | --- |
| `/impasto starry` | A starry night over a lake, a river of moonlight (the default) |
| `/impasto christmas` | The river frozen over, snow, lit trees on the far shore |
| `/impasto halloween` | A pumpkin moon over a swamp, bats, jack-o'-lanterns afloat |
| `/impasto lunar` | A red-and-gold new year's night, a river of lotus lanterns |
| `/impasto kids` | A sunflower day: turquoise sky, balloons, a paper boat |
| `/impasto thanksgiving` | Dusk over a wheat field, a creek carrying the sunset |
| `/impasto auto` | Follows the calendar: each holiday's scene in its season, the starry night otherwise |
| `/impasto off` | Turns the skin off; `/impasto starry` brings it back |

`/impasto` alone lists them. The scene names are also taken in Chinese (`/impasto 圣诞`, `/impasto 农历`).

## The devil

Click the angel's halo three times, one click at a time, about half a second apart. The halo brightens at each click so you can see it was counted. On the third, devil Claude drops out of the sky, kicks the angel away, swallows your code, burps, throws up a very large rainbow, and the code is back as it was. It takes about six seconds, and it is all paint: nothing of yours is touched.

`/impasto devil` calls him without the clicks. `/impasto debug` shows which clicks the app passed to the skin, if the halo seems not to answer.

## Where it draws

The painting shows in the Claude desktop app and the mobile app. In a terminal there is no backdrop to paint on, so only the colours change. The prank's animation plays in the desktop app; with Reduce Motion on, the app plays no animation and the angel simply stays where he is.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install impasto --marketplace leetn9468/impasto
```

Or from a shell:

```
claude plugin install impasto --marketplace leetn9468/impasto
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `leetn9468/impasto`, then Add plugin.

There is nothing to set up. The starry night appears, and your choice of scene is remembered across sessions.

## Licence

Free for any noncommercial use, under the PolyForm Noncommercial License 1.0.0 (see `LICENSE`). Painted by TN Lee, after the paint engine of Diary for Mom.

Impasto is an independent, unofficial skin. Claude and Claude Code are Anthropic's; the crab-like figure in the painting is a fan's rendering of the Claude Code mascot.
