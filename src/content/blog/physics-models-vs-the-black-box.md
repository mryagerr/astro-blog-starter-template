---
title: 'Physics Has Models. Machine Learning Has Black Boxes.'
description: 'A physics model can be worked out from first principles — derived, interrogated, and defended line by line. A machine learning model can only be trusted. The difference is not academic. It is the difference between analytics you can stand behind and analytics that runs on "trust me."'
pubDate: 'Jul 31 2026'
difficulty: 'high'
tags: ['analysis', 'culture']
---

Physics gives us models. Not fits, not correlations — models. `F = ma`. Maxwell's equations. The ideal gas law. Each one is a compact statement about how the world works that you can pick up, turn over, and *work out*. You can derive it from something more fundamental. You can predict what it will do in a situation it has never seen. And when it is wrong, you can trace the wrongness back to a specific assumption you made and know exactly why it broke.

A machine learning model is not this. A large language model is emphatically not this. They are extraordinary tools, but they are curve fits — high-dimensional interpolations over data someone collected. You cannot work them out. You can only run them and trust the output.

That distinction is the whole game. Because analytics lives or dies on whether the people consuming your numbers can trust them, and trust comes from one thing: the ability to show your work, top to bottom, with no step that reduces to "trust me."

## What "Working Out" a Model Actually Means

When a physicist hands you `F = ma`, they are not handing you a lookup table of forces and accelerations they happened to measure. They are handing you a *mechanism*. You can:

- **Derive it** from more basic principles, or derive consequences from it.
- **Interrogate it** — ask what each term means, what it assumes, where it applies.
- **Extrapolate it** — apply it to a mass and acceleration no one has ever tested, and be right.
- **Falsify it** — state in advance the exact conditions under which it would fail (relativistic speeds), and know *why*.

This is what it means for a model to be transparent. Not that it is simple — general relativity is not simple — but that it is *legible*. Every step from premise to prediction is a step you can inspect and, if you disagree, argue with.

Consider what the ideal gas law makes explicit:

```
PV = nRT

P = pressure        Assumption: particles are point masses (no volume)
V = volume          Assumption: no intermolecular forces
n = moles           Assumption: collisions are perfectly elastic
R = gas constant    Known: fails at high pressure / low temperature
T = temperature
```

The model tells you where it works and, just as importantly, where it stops working. When your real gas deviates from `PV = nRT`, you are not mystified. You know it is because the pressure got high enough that molecular volume matters, and you reach for the van der Waals correction. The failure is *diagnostic*. It points at the assumption that broke.

That is the property analytics should be chasing.

## What a Black Box Takes Away

A machine learning model — a gradient boosting ensemble, a neural network, an LLM — is a function fit to data. It can be astonishingly accurate. It can also be accurate for reasons no one can articulate.

Ask a physics model why it predicts what it predicts, and it answers with a derivation. Ask a neural network the same question and the honest answer is: "because these four million weights, adjusted by gradient descent over this training set, produce that output." That is not an explanation. It is a description of a fitting procedure.

The practical consequences are specific:

| Property | Physics Model | Machine Learning Model |
|---|---|---|
| **Can you derive it?** | Yes — from first principles | No — it is fit, not derived |
| **Does it extrapolate?** | Yes, within stated regime | Unreliably; degrades outside training distribution |
| **Why did it fail?** | Traceable to a named assumption | Often unknowable without deep investigation |
| **Can a stakeholder check it?** | Yes, line by line | No — feature importances at best, and those can mislead |
| **What does it encode?** | Mechanism | Correlation in a dataset |

None of this makes machine learning bad. It makes it a *black box* — and a black box is not a neutral abstraction. It is a component you trust without being able to interrogate. The moment your inferences outrun your understanding of the box, you are exposed. (This is the compounding-debt argument I made in [Fear the Black Box](/article/fear-the-black-box/); the physics comparison is why the debt is so much steeper than it looks.)

The failure mode has a name: distribution shift. A model trained on last year's data quietly starts scoring this year's data, which is subtly different, and the predictions drift wrong for months before anyone notices. A physics model does not do this, because it does not depend on the data staying the same — it depends on the *mechanism* staying the same, which it does. `F = ma` does not degrade because you drove somewhere new.

## Why This Matters for Analytics

Here is the uncomfortable part. Most analytics is closer to the black box than to the physics model — not because it uses machine learning, but because of how it is built and defended.

A dashboard KPI that nobody can reproduce from raw data is a black box. An inherited pipeline that "has always worked" is a black box. A revenue figure that passes through six transformations, three of which encode an undocumented business rule, is a black box. When someone asks "why is this number what it is?" and the answer is "that's what the query returns," you have shipped a curve fit. You have shipped *trust me*.

And "trust me, bro" is exactly the standard analytics cannot afford to meet. The physicist's authority does not come from being smart or senior. It comes from the fact that anyone who doubts the model can *check it* — the derivation is right there. Your authority as an analyst has to come from the same place. Not from your title, not from the sophistication of your tooling, but from the fact that every number you publish can be walked back to its source, one legible step at a time.

The two failure modes look like this:

```
Black-box analytics:
  Source? → "not sure" → Transform? → "the pipeline does it" →
  Assumption? → "it's always been fine" → Decision. Trust: borrowed.

Physics-grade analytics:
  Source → cleaned (dedup rule, documented) → aggregated (grain, documented) →
  netted (refund logic, tested) → published (date range, documented) →
  Decision. Trust: earned, and checkable at every arrow.
```

The second one is not more sophisticated. It is more *honest*. Every arrow is a claim you can defend.

## Top to Bottom, or It Doesn't Count

The standard is not "understand your machine learning model perfectly" — sometimes you genuinely can't, and sometimes the accuracy is worth the opacity. The standard is that **nothing in your analytics gets the black-box exemption by default.** Every number an executive acts on should be traceable end to end, with each transformation named and each assumption written down where the code lives.

Concretely, for any metric you publish, these five questions must have answers:

1. Where does this number come from at the row level?
2. What transformations sit between the source and the output?
3. What assumptions are baked into those transformations?
4. When were those assumptions last validated against reality?
5. If the upstream data changed silently, how would you find out?

A physicist can answer the equivalent questions about `PV = nRT` instantly, because the model *is* the answers. Your pipeline should aspire to the same. When it can't — when there is a step you cannot explain — that step is your van der Waals correction waiting to happen: the place the model will break, hiding in plain sight because no one made it legible.

Where machine learning is genuinely the right tool, the answer is not to avoid it but to build the legibility around it that the model itself lacks: reproducible features, a documented training window, validated labels, a monitoring process that surfaces drift, and an intuitive account of why the model behaves as it does. You cannot make the box transparent, so you make everything around the box transparent. That is the price of putting a black box in a chain that people trust.

## The Name of the Game

Physics earned its authority over four centuries by refusing the black box — by insisting that a model is not a model until you can work it out. That insistence is why a bridge engineer can stake lives on `F = ma` without a shred of anxiety.

Analytics is playing the same game with far lower stakes and far less discipline. Every time a number goes out that no one can trace, the account gets debited a little. Every time a stakeholder catches an unexplained figure, the withdrawal is large. Trust is the only currency that lets analytics function at all, and it is spent the instant "trust me" replaces "here's the derivation."

You will never make a neural network as legible as the ideal gas law. But you can make your pipeline that legible. You can make your KPIs that legible. You can decide that in your analytics, the black box is the exception you justify explicitly — never the default you inherit silently. That decision is the difference between being believed and being audited.

## The Low Hanging Fruit

Take one number you publish regularly and try to "work it out" the way a physicist would — from first principles, out loud, with no appeal to "the query does it."

Start at the published figure and go backward. Name every transformation between it and the raw source. For each one, state the assumption it encodes and whether that assumption has ever been checked against reality. When you hit a step you cannot derive — a join whose logic you don't fully understand, a filter whose reason is lost — you have found your black box. Mark it.

Then do the one thing that separates a model from a fit: write down, in advance, the condition under which this number would become wrong. If an upstream schema changed, if a business rule shifted, if the data moved outside the range you built it on — would you know? If not, add the validation that would tell you.

Do this once and you will find at least one step you had been trusting rather than understanding. That step is where your analytics is a black box. And now that you can see it, it is where your credibility is either earned or quietly borrowed.

## Related Articles

- **[Fear the Black Box](/article/fear-the-black-box/)** — The general case: why any component you trust without understanding is a compounding liability, and how to trace a number end to end.
- **[Trust and Time Are the Real Currencies of Data ROI](/article/data-trust-and-time-the-real-currencies-of-roi/)** — Why trust, once spent, is the hardest thing in analytics to buy back.
- **[Don't Build Analytical Castles on Sand](/article/analytics-technical-debt/)** — Undocumented assumptions and untested transforms as the debt that black boxes quietly accrue.
