# THE MESSAGE: *Scaling Up-Side-Down*

A brief for the designers of the new homepage. It covers what the book says, who it is for, the
argument in eight steps, a bank of exact quotes, and the numbers that can carry a picture.

**Sources** (all local, all read in full for this brief):
- `source/src_copy.ts`: the lines on the current site. Each is quoted word for word from Michael's
  manuscript, with the **manuscript** line number in a comment. The manuscript itself is not
  available here, so a citation like `copy.ts L216` means "manuscript line 216, as recorded in
  copy.ts". Each one was checked against copy.ts, not against the manuscript.
- `source/public_bootloader.md`: the SUSD Bootloader V16, the book's appendix, Michael's own words.
  A citation like `bootloader.md:838` is that file's line number.

**The copy rule:** every sentence on the site must be word for word from one of these two sources.
Labels, buttons, numbers and UI microcopy are the only exception. Every quote in this file was
checked by script against the exact line cited, character for character. The quotes use straight
apostrophes (') and em dashes (—), as the sources do. Where a Bootloader line wraps the words in
Markdown bold or italics, the `*` marks are not part of the quote. Table cells quoted here are the
cell text only.

---

## 1. The message

**In one sentence (my words, not for the site):**
If you run a bootstrapped business of twelve people or fewer, the growth playbook you inherited was
written for funded companies, so stop adding people and complexity in a straight line and grow in
cycles instead (Up to grow, Side to stabilize, Down to prune) on a short, fixed set of systems,
so each cycle ends with wider margins, not a bigger business that breaks past twelve.

**In Michael's best single quote** (it states the book and explains the title at once):

> Real scaling is cyclical. Up for growth. Side for stability. Down for pruning. The hyphens aren't decoration—they're the rhythm. Skip a leg, tip upside down.
>
> — bootloader.md:795

Two runners-up, for different jobs:
- **The hook** (why a founder leans in): "You were never the problem. The model you inherited was." (copy.ts L216)
- **The mechanism** (why it's true, in one line): "Every hire compounds complexity before it compounds capacity." (copy.ts L696)

**The title tells the whole story.** The Bootloader says so ("The title is the argument. It unfolds across three parts." (bootloader.md:782)), and each reading of the title is one part:

| Reading | Part | What it names |
|---|---|---|
| Scaling Upside Down | Part I | The Diagnosis |
| Scaling Up-Side-Down | Part II | The Operating System |
| Scaling USD | Part III | The Scoreboard |

*(bootloader.md:794-796. The labels are verbatim; the full cells are in Q3, Q34 and Q69.)* This gives
a design device that is about the book itself: the same three words, re-hyphenated, read as the
problem, then the fix, then the proof. Note the vocabulary rule: "Scaling Upside Down" (no hyphens)
is the **problem**, and "Scaling Up-Side-Down" (hyphens) is the **framework** (bootloader.md:3960-3961).

---

## 2. Who it is for, and how a visitor knows in seconds

**The reader:** a bootstrapped, founder-led business of 1 to 12 people, operating on "Rented Scale"
(it rents scale through contractors, software and subscriptions instead of buying it with capital).
From the discovery call notes (context only, **not** site copy): the book is "aimed at bootstrap
founders with teams of 12 and under", and the target reader has "grown to around 8 people, felt the
pain and burnout of complexity". The first of the three things Michael called most important in his Oct 27 feedback: "helping visitors
immediately recognize that the book is for them".

### The entry question: the fastest self-identification there is

> How many people are on your team?
>
> — bootloader.md:310

This is the book's own first move. The Bootloader calls it "Step 0" and says to always ask it first
(bootloader.md:308-310, 359). Why it works:
"This single question reveals location on the destination map, physics that apply, and what advice will fit vs. make things worse." (bootloader.md:314)

The microcopy under the question can use the Bootloader's own wording of it (from the starting
prompt, bootloader.md:416):
`How many people are on your team? (Count everyone you coordinate with, including yourself — employees and integrated contractors, not scoped contractors who deliver isolated outputs.)`

"Team" means **coordination load**, not payroll: "The question isn't how many people you pay. It's how many people you have to coordinate." (bootloader.md:3400) The full clarification:

```
**Clarification:** "Team" means coordination load, not payroll headcount. Count everyone you carry in your head — employee or contractor, anyone you align weekly, manage output for, or coordinate with other team members. Don't count scoped contractors who deliver isolated outputs. Count yourself — team size 1 means just you. (See Section 3.1.3 for the full test.)
```
*bootloader.md:312-312, verbatim*

### The team-size bands (exact definitions)

The canonical table:

```
| Band | Range | Classification | Routing |
|------|-------|----------------|---------|
| Solopreneur | 1 | Destination | → State Classification |
| Small Team | 2-3 | Destination | → State Classification |
| Valley | 4-7 | Transition zone (between Small Team and Team) | → State Classification (note: "Stuck" may be location, not state) |
| Team | 8-12 | Destination (center of gravity for most bootstrapped businesses) | → State Classification |
| Threshold | 13-14 | Warning zone | → Graveyard Warning mandatory before any advice |
| Graveyard | 15-39 | Structural trap | → §3.2.1 immediately. State routing bypassed. |
| Team of Teams | 40+ | Out of scope | → Boundary acknowledgment. Different physics apply. |
```
*bootloader.md:69-77, verbatim*

The same bands as the book describes the destinations (the revenue ranges are the printed book's
illustrative figures, not benchmarks, per bootloader.md:3418):

```
| Destination | Team Size | Revenue Range† | ARPE Range | Characteristics |
|-------------|-----------|---------------|------------|-----------------|
| **Solopreneur** | 1 | $200K-$500K | $200K-$500K | Maximum leverage, minimum resilience. You are the business. |
| **Small Team** | 2-3 | $500K-$1.5M | — (no author band; measure Revenue ÷ Coordination Load) | Leader + helpers. Coordination still manageable. 96% stay small. |
| **Valley** | 4-7 | — | — | Transition zone between Small Team and Team. Not a destination. |
| **Team** | 8-12 | $2M-$3.6M | Services $200K-$300K · SaaS $350K-$500K · Digital Products $220K-$350K | Leader + team. Still know everyone's name. Where most beautiful bootstrapped businesses live. |
| **Team of Teams** | 40+ | $10M+ (book) | $250K+ (book — not calibrated; out of scope) | Senior team of 5-7, each leading teams of 7-10. Requires bought-scale physics or 10-year internal runway. Out of scope. |
```
*bootloader.md:3410-3416, verbatim*

The Graveyard, defined:

```
| Characteristic | Why It's Dangerous |
|----------------|-------------------|
| Too big to be lean | Lost the advantages of small |
| Too small to have management infrastructure | Can't afford the coordination layers |
| Structurally unsustainable | Without capital or traditional moats |
| Coordination threshold exceeded | 66+ coordination pathways |
```
*bootloader.md:3436-3441, verbatim*

The three ways out of it (bootloader.md:3457-3461): **Streamline to 12**, **Raise capital**, or
**Crisis**. "There is no "optimize your way through" option." (bootloader.md:3463)

**How the answer itself reads:**

```
| Answer | Signal |
|--------|--------|
| Quick, clean ("eight") | Number is holdable — likely okay |
| Fumbling, hedging, qualifying | Organization has grown past what they can see — likely in trouble regardless of stated state |
```
*bootloader.md:328-331, verbatim*

Design idea: a single input or a 1-to-40+ slider. The number lands the visitor on the map (Solopreneur,
Small Team, Valley, Team, Threshold, Graveyard, Team of Teams), and the page answers in Michael's words
for that band. The bands are the "you are here" moment.

### Symptoms a visitor will recognize as their own (exact words)

These are the founder's own voice as the Bootloader records it. They work as "Is this you?" lines.

| Symptom | Source |
|---|---|
| "I have to do everything" | bootloader.md:6279 |
| "I'm burned out" | bootloader.md:6254 |
| "If I'm not growing, I'm failing" | bootloader.md:6280 |
| "I work hard but have nothing to show" | bootloader.md:6281 |
| "I should be further along by now" | bootloader.md:6282 |
| "I've read all the books, nothing works" | bootloader.md:6283 |
| "Things used to be easier" | bootloader.md:6255 |
| "I used to know what everyone was doing" | bootloader.md:3084 |
| "My team is fighting" | bootloader.md:6253 |
| "Revenue flat despite effort" | bootloader.md:2999 (a Stuck signal) |
| "Things work but feel heavy" | bootloader.md:3000 (a Stuck signal) |
| "Good people start looking for exits" | bootloader.md:3139 (a Red signal) |
| "We've lost clarity about what actually matters" | bootloader.md:3150 (a Red signal) |

Grouped by the three symptoms the brief asks about:
- **Burnout:** "I have to do everything", "I'm burned out". The book's reframe is
  "Burnout is structural (Today/Tomorrow/Toys unseparated), not personal weakness" (bootloader.md:264).
- **Revenue plateau:** "Revenue flat despite effort", "Things work but feel heavy". The reframe is
  "Plateaus are destinations to optimize, not crises to push through" (bootloader.md:258).
- **Complexity:** "Things used to be easier", "I used to know what everyone was doing", "My team is
  fighting". The reframe is "Coordination cost is physics (Graičiūnas), not a leadership failure" (bootloader.md:265).

### Who it IS for and IS NOT for (exact)

```
| Criterion | Specification |
|-----------|---------------|
| **Bootstrapped / self-funded** | No outside capital, or capital that doesn't change physics |
| **Founder-led** | Founder is still operational, not just governance |
| **1-12 employees** | Or approaching this range |
| **Rented-scale physics** | Can't buy through transitions, must cycle through |
| **Stuck between sizes** | "Too big to be small, too small to be big" |
| **Margin matters** | Need to collect along the way, not just at exit |
| **Tired of traditional advice** | Tried the playbooks, they didn't fit |
```
*bootloader.md:4771-4779, verbatim*

```
| Criterion | Why It Doesn't Fit |
|-----------|-------------------|
| **Venture-backed** | Bought-scale physics—different operating system needed |
| **40+ employees** | Beyond Rented Scale scope—needs OS v2.0 or v3.0 |
| **Pure lifestyle business (no systems)** | Framework assumes systems-building intent |
| **Pre-revenue / idea stage** | Framework assumes operating business |
| **Seeking 10x growth** | Framework optimizes for margin, not size |
| **Exit-focused (flip in 2-3 years)** | Framework optimizes for collect-along-the-way |
| **Already at Team of Teams** | Different physics, different framework needed |
```
*bootloader.md:4785-4793, verbatim*

Any business type: "The physics don't care what you sell." (bootloader.md:510)

---

## 3. The argument in eight steps

Each step has the claim (my words), Michael's exact lines, and the picture it can carry.

**1. The map you inherited was drawn for someone else.**
Conventional growth advice is built for the few companies that buy their scale with capital (the "3%"),
not the bootstrapped many (the "97%").
- "There are two kinds of growth. You inherited the wrong map." (bootloader.md:838)
- "The map most founders inherited was drawn for Bought-Scale companies — where capital absorbs the mistakes and infrastructure arrives before it's needed." (bootloader.md:243)
- "Traditional advice assumes bought scale. 97% operate with rented scale." (bootloader.md:1391)
- "97% of bootstrapped businesses would not pass VC evaluation." (bootloader.md:4837)
- The root is Larry Greiner's 1972 Harvard paper (discovery call). The Bootloader's one-liner on Greiner: "Gave a ROADMAP. This framework gives a MAP." (bootloader.md:1100)
- *Picture:* a straight line up versus stacked cycles; 97 against 3.

**2. You rent your scale, so mistakes cost margin right away.**
Today a business rents scale (contractors, subscriptions, SaaS), so complexity can be added faster than
the team can absorb it.
- "This framework is built for Rented-Scale physics — where every mistake costs margin and every hire has to earn its keep before the next one is possible. Same game. Different rules." (bootloader.md:243)
- "Every hire compounds complexity before it compounds capacity." (copy.ts L696)
- "Each hire is a microdose of complexity. The cycle processes it before the next dose." (bootloader.md:1364)
- *Picture:* the "Error absorption" row of the Rented vs. Bought table, Bought Scale "Capital absorbs mistakes" (bootloader.md:1376) against Rented Scale "Every mistake costs margin" (bootloader.md:1376).

**3. The physics: complexity against capacity.**
Every person you add adds more lines of coordination than the last, until complexity outruns capacity.
- "Complexity > Capacity = Redline." (copy.ts L2997) "Every addition makes it worse." (copy.ts L2997)
- "Capacity > Complexity = Oxygen." (copy.ts L2999) "The systems can carry what the business creates." (copy.ts L2999)
- The Bootloader's table versions: "The business is drowning. Every addition makes it worse." (bootloader.md:717) / "The business can breathe. Systems carry what the business creates." (bootloader.md:718)
- 12 people = 66 coordination pathways, "maximum before coordination explodes" (bootloader.md:2216).
- *Picture:* the n(n-1)/2 dot-and-line network: 3 people = 3 lines, 8 = 28, 12 = 66, 15 = 105, 39 = 741 (section 5).

**4. The trap: Scaling Upside Down, and The Graveyard past twelve.**
Revenue goes up while margin goes down. Push past 12 people without capital and you land in a zone
(15-39) that is too big to be lean and too small to manage.
- "Most founders think they're scaling. They're not. They're scaling upside down—chasing growth while margins erode, complexity compounds, and they keep less of what they make." (bootloader.md:794)
- "You're getting bigger while keeping less" (bootloader.md:830) (the cell for "Revenue up + margin down = Scaling Upside Down")
- "Past twelve, something breaks." (copy.ts L3509)
- "Complexity that accumulated faster than the structure could hold." (copy.ts L2021)
- "The Graveyard is not a temporary problem. It's a structural trap." (bootloader.md:3451)
- "Most bootstrapped founders enter the Scaling Trap having reinvested everything back into the company with little to show for it." (bootloader.md:824)
- *Picture:* the band map with 15-39 marked as the Graveyard; the tower that tips.

**5. The fix: Cyclical Growth. Up, Side, Down, repeat.**
Growth is a rhythm of three seasons, not a line: grow (Up), absorb and stabilize (Side), prune and
take back margin (Down). Each cycle starts higher than the last. It is not slow growth.
- "Real scaling is cyclical. Up for growth. Side for stability. Down for pruning. The hyphens aren't decoration—they're the rhythm. Skip a leg, tip upside down." (bootloader.md:795)
- "Up. Side. Down. Repeat." (copy.ts L1713)
- "Each cycle deposits systems and margin. The next cycle withdraws from a larger account." (bootloader.md:866)
- "The growth is real. The path is seasonal." (bootloader.md:851)
- "Cyclical Growth is pro-growth. It claims a different mechanism, not a different destination." (bootloader.md:879)
- "You can't build a building with only height. You need all three dimensions or it topples." (bootloader.md:816)
- *Picture:* three axes (Up = Y, Side = X, Down = Z, section 5) or a staircase of loops, each ending higher.
  Michael asked for this to be "clear" (Oct 27 feedback); the draft reply proposed blocks that go up,
  sideways and down, then repeat.

**6. What you build: a closed set of twelve systems, run on three inversions.**
The work is building machines (systems), not chasing numbers (goals). At most twelve: four per season.
And the vehicle has to match: Bicycle, then Car, then Limousine.
- "Four for Scaling Up, four for Scaling Sideways, four for Scaling Down. Twelve." (copy.ts L3119)
- "You don't win by hitting a revenue number. You win by installing a machine that hits the number for you." (bootloader.md:659)
- "12 isn't a goal. It's a protective limit." (bootloader.md:2210)
- **The three core inversions** (bootloader.md:644-721), each with Michael's anchor line:
  1. **Systems as the Goal**: "You don't win by hitting a revenue number. You win by installing a machine that hits the number for you." (bootloader.md:659)
  2. **Complexity as the Enemy**: "Scaling isn't size or speed—it's margin expansion." (bootloader.md:696)
  3. **Enough as a Destination**: "Your center of gravity isn't where you're trying to get to. It's where you stop." (bootloader.md:711)
- **Bicycle, Car, Limousine** (bootloader.md:3564-3569; Airplane is the fourth, for Team of Teams, out of scope):
  "You can't scale a Bicycle. You can only pedal faster until you collapse." (bootloader.md:3619) The test is
  "Can revenue continue 14 days without you?" (bootloader.md:3577). If no: "The business stops when you stop." (bootloader.md:3828)
- *Picture:* the 12 systems as a 3x4 grid under Up / Side / Down (section 5); a vehicle that grows an engine.

**7. AI makes it urgent: it speeds up whichever system you are in.**
AI makes output cheap and makes adding complexity even easier, so it pushes more founders into the trap,
unless the business runs as a closed system.
- "In an open system, AI accelerates chaos. In a closed system, AI accelerates clarity." (copy.ts L4523)
- "Technology changes yield. It doesn't change coordination physics. A founder managing ten high-output AI agents still has one brain." (bootloader.md:3188)
- "Founders don't escape complexity. They change its form — from coordination you can see to maintenance you can't." (bootloader.md:4068)
- "This framework is a closed system. Adding components outside the specification breaks it." (bootloader.md:4761)
- *Picture:* the Closed System / Open System table, side by side (bootloader.md:4754-4759, section 5).

**8. The Bootloader is the closed system, as a file.**
The book's appendix is a spec, the SUSD Bootloader (V16, 35,445 words). You upload it to your AI so the
AI stays inside the framework. It is a file and an operating system, not a prompt to paste. You get it
by email opt-in.
- "This document is the closed system." (copy.ts L4525)
- "The pages are reference. The file is the operating system." (copy.ts L4497)
- "This is not a playbook. It is a constraint layer." (bootloader.md:213)
- "The book creates transformation. This bootloader prevents drift." (bootloader.md:215) / "Neither works alone." (bootloader.md:15)
- "Upload the file and use the starting prompt provided with it." (copy.ts L4531) "Then let the system locate you." (copy.ts L4533)
- Michael, Oct 27 (feedback, not site copy): "It's a file/spec/software containing the OS, not just
  something to paste into AI." On the call he called it "software as a book".
- *Picture:* a document object with its version and word count; book and file as a pair.

---

## 4. Quote bank (69 lines, all checked)

Each line below is exact. It is grouped by theme, and the strongest headline candidate in each group comes first.
Fragments from table cells are marked by having no closing period; they work as labels or pull-lines,
not as body sentences.

### Hook: the first line someone reads

**Q1** · `copy.ts L216`
> You were never the problem. The model you inherited was.

**Q2** · `bootloader.md:838`
> There are two kinds of growth. You inherited the wrong map.

**Q3** · `bootloader.md:794`
> Most founders think they're scaling. They're not. They're scaling upside down—chasing growth while margins erode, complexity compounds, and they keep less of what they make.

**Q4** · `copy.ts L696`
> Every hire compounds complexity before it compounds capacity.

**Q5** · `bootloader.md:558`
> You're not scaling. You're financing complexity with exhaustion.

**Q6** · `bootloader.md:1228`
> Why do they call it a lifecycle when there are no cycles?

**Q7** · `copy.ts L461`
> We were Scaling Upside Down.

**Q8** · `bootloader.md:696`
> Scaling isn't size or speed—it's margin expansion.

**Q9** · `bootloader.md:3868`
> Revenue is applause. Profit is oxygen. The scoreboard tells you which one you're chasing.

### Who it's for

**Q10** · `bootloader.md:310`
> How many people are on your team?

**Q11** · `bootloader.md:3400`
> The question isn't how many people you pay. It's how many people you have to coordinate.

**Q12** · `bootloader.md:4777`
> Too big to be small, too small to be big

**Q13** · `bootloader.md:473`
> No one had built a playbook for this destination — because no one had treated it as one.

**Q14** · `bootloader.md:3420`
> Staying at one destination is an intelligent choice, not failure.

### The problem

**Q15** · `bootloader.md:1391`
> Traditional advice assumes bought scale. 97% operate with rented scale.

**Q16** · `bootloader.md:243`
> The map most founders inherited was drawn for Bought-Scale companies — where capital absorbs the mistakes and infrastructure arrives before it's needed.

**Q17** · `bootloader.md:243`
> This framework is built for Rented-Scale physics — where every mistake costs margin and every hire has to earn its keep before the next one is possible. Same game. Different rules.

**Q18** · `bootloader.md:4837`
> 97% of bootstrapped businesses would not pass VC evaluation.

**Q19** · `copy.ts L1993`
> Always launching. Always hiring. Always adding.

**Q20** · `copy.ts L1995`
> But inside, nothing ever settled.

**Q21** · `bootloader.md:1553`
> Goals are events. You hit them, then they're gone. You start over. The business didn't change—you just ran faster.

**Q22** · `bootloader.md:832`
> Collect along the way, because 'later' probably won't arrive.

### The equations

**Q23** · `copy.ts L2997`
> Complexity > Capacity = Redline.

**Q24** · `copy.ts L2997`
> Every addition makes it worse.

**Q25** · `copy.ts L2999`
> Capacity > Complexity = Oxygen.

**Q26** · `copy.ts L2999`
> The systems can carry what the business creates.

**Q27** · `bootloader.md:711`
> Your center of gravity isn't where you're trying to get to. It's where you stop.

### The trap (The Graveyard)

**Q28** · `copy.ts L3509`
> Past twelve, something breaks.

**Q29** · `copy.ts L2021`
> Complexity that accumulated faster than the structure could hold.

**Q30** · `bootloader.md:3451`
> The Graveyard is not a temporary problem. It's a structural trap.

**Q31** · `bootloader.md:3463`
> There is no "optimize your way through" option.

**Q32** · `bootloader.md:3498`
> Stay at Team. It's not failure—it's intelligence.

### The cycle (Up, Side, Down)

**Q33** · `copy.ts L1713`
> Up. Side. Down. Repeat.

**Q34** · `bootloader.md:795`
> Real scaling is cyclical. Up for growth. Side for stability. Down for pruning. The hyphens aren't decoration—they're the rhythm. Skip a leg, tip upside down.

**Q35** · `bootloader.md:816`
> You can't build a building with only height. You need all three dimensions or it topples.

**Q36** · `bootloader.md:851`
> The growth is real. The path is seasonal.

**Q37** · `bootloader.md:866`
> Each cycle deposits systems and margin. The next cycle withdraws from a larger account.

**Q38** · `bootloader.md:4488`
> Each cycle starts higher than the last because systems built in Side and margin captured in Down compound into the next Up.

**Q39** · `bootloader.md:879`
> Cyclical Growth is pro-growth. It claims a different mechanism, not a different destination.

**Q40** · `copy.ts L2564`
> Something needs to be cut.

**Q41** · `copy.ts L2564`
> The business stops asking for more and starts asking what to keep.

### The systems (and the vehicle)

**Q42** · `copy.ts L2408`
> Systems were what actually held the weight.

**Q43** · `copy.ts L3119`
> Four for Scaling Up, four for Scaling Sideways, four for Scaling Down. Twelve.

**Q44** · `bootloader.md:659`
> You don't win by hitting a revenue number. You win by installing a machine that hits the number for you.

**Q45** · `bootloader.md:2210`
> 12 isn't a goal. It's a protective limit.

**Q46** · `bootloader.md:544`
> 12 isn't where you're trying to get. It's the line you don't cross.

**Q47** · `copy.ts L2610`
> The twelve we'd mapped were enough.

**Q48** · `bootloader.md:3619`
> You can't scale a Bicycle. You can only pedal faster until you collapse.

**Q49** · `bootloader.md:3828`
> The business stops when you stop.

**Q50** · `bootloader.md:557`
> The rhythm carries the business instead of you carrying it.

### AI

**Q51** · `copy.ts L4523` (1st + 2nd sentence of L4523, per the copy.ts comments)
> In an open system, AI accelerates chaos. In a closed system, AI accelerates clarity.

**Q52** · `bootloader.md:4761`
> This framework is a closed system. Adding components outside the specification breaks it.

**Q53** · `bootloader.md:3188`
> Technology changes yield. It doesn't change coordination physics. A founder managing ten high-output AI agents still has one brain.

**Q54** · `bootloader.md:4068`
> Founders don't escape complexity. They change its form — from coordination you can see to maintenance you can't.

### The Bootloader (a file, not a prompt)

**Q55** · `copy.ts L4525`
> This document is the closed system.

**Q56** · `copy.ts L4497`
> The pages are reference. The file is the operating system.

**Q57** · `copy.ts L4553, L4555`
> The book changed how you think. This SUSD Bootloader changes how you operate.

**Q58** · `bootloader.md:213`
> This is not a playbook. It is a constraint layer.

**Q59** · `bootloader.md:215`
> The book creates transformation. This bootloader prevents drift.

**Q60** · `bootloader.md:15`
> Neither works alone.

**Q61** · `copy.ts L4531`
> Upload the file and use the starting prompt provided with it.

**Q62** · `copy.ts L4533`
> Then let the system locate you.

### The book

**Q63** · `copy.ts L234`
> Half of this book is meant to be read. The other half is meant to be used.

**Q64** · `copy.ts L246`
> You may be tempted to skip straight to it. I wouldn't.

**Q65** · `copy.ts L192, L194`
> The business held. Not just held—it grew.

**Q66** · `copy.ts L3319`
> Our margins stopped shrinking.

**Q67** · `copy.ts L3463`
> The contrast wasn't the ranking. The contrast was the cost.

**Q68** · `bootloader.md:782`
> The title is the argument. It unfolds across three parts.

**Q69** · `bootloader.md:796`
> The dollar sign isn't clever wordplay—it's the proof. If margins aren't widening, you're not scaling.


**Do not use (not in either source):** "The cycle isn't something you install. It's something you stop
resisting." This line appears in the unsent draft reply to Michael, but it is in neither copy.ts nor the
Bootloader, so it has no line number. Use it only once Michael gives the manuscript line.

---

## 5. Numbers that can carry visuals (exact)

### 12, the number that runs through everything

```
| Element | The 12 | Why It Matters |
|---------|--------|----------------|
| **12 systems** | The finite set of recurring machines | Prevents infinite to-do lists. Makes the game winnable. |
| **12 people** | Team destination upper bound (8-12) | Where coordination is still manageable. Where most beautiful bootstrapped businesses live. |
| **12-person coordination threshold** | 66 pathways (pairwise channel math), maximum before coordination explodes | The math ceiling. Beyond this, complexity bankrupts founder sanity. |
| **12 USD mini-cycles** | Each person = one complete cycle to integrate | Why hiring "12 people" is actually 12 separate integration events. |
```
*bootloader.md:2212-2217, verbatim*

The Bootloader is explicit that these are separate limits:
"These are related but independent constraints, not a mathematical identity." (bootloader.md:2240)

### The 12 systems, grouped by season (Michael's own; readers derive their own)

```
| SCALING UP (Growth) | SCALING SIDEWAYS (Stabilization) | SCALING DOWN (Optimization) |
|---------------------|----------------------------------|----------------------------|
| Content & Product Creation | Team & Roles | Profitability Optimization |
| Lead Generation | Systematization | Risk Management |
| Lead Conversion | Technology, Automation & AI | Operational Efficiency |
| Customer Success & Retention | Inventory & Fulfillment | Product Quality & Delivery |
```
*bootloader.md:2005-2010, verbatim*

As lists:
- **Up (Scaling Up, Growth):** Content & Product Creation · Lead Generation · Lead Conversion · Customer Success & Retention
- **Side (Scaling Sideways, Stabilization):** Team & Roles · Systematization · Technology, Automation & AI · Inventory & Fulfillment
- **Down (Scaling Down, Optimization):** Profitability Optimization · Risk Management · Operational Efficiency · Product Quality & Delivery

The Rhythm layer (D/W/M/Q, Weekly Systems Check, Monthly M.E.D., Quarterly USD Cycle Planning) is
**not** counted as systems (bootloader.md:2025-2027). These twelve are Michael's.
"Your map, not the map" (bootloader.md:2036) is the framework's rule (the cell reads "These are the author's 12. Reader derives their own.").

### Three dimensions: Up, Side, Down as axes

```
| Dimension | Axis | What It Does |
|-----------|------|--------------|
| **Up** | Y-axis | Growth (the axis everyone obsesses over) |
| **Side** | X-axis | Stabilization (the axis no one sees) |
| **Down** | Z-axis | Optimization (the axis everyone fears) |
```
*bootloader.md:806-810, verbatim*

### Two shapes of growth

```
| Category | Shape | How Growth Happens |
|----------|-------|-------------------|
| **Linear Growth** | Straight line upward | Push harder, hire faster, scale bigger. Progress is forward motion. |
| **Cyclical Growth** | Stacked cycles | Complete a cycle (Up/Side/Down), start the next one higher. Progress is seasonal. |
```
*bootloader.md:840-843, verbatim*

### The team-size bands

Solopreneur **1** · Small Team **2-3** · Valley **4-7** · Team **8-12** · Threshold **13-14** ·
Graveyard **15-39** · Team of Teams **40+** (bootloader.md:69-77; full table in section 2).

### Coordination pathways: n(n-1)/2

```
| Team Size (N) | Calculation | Pathways | Zone |
|---------------|-------------|----------|------|
| 1 | 1(0)/2 | 0 | Solopreneur |
| 2 | 2(1)/2 | 1 | Small Team |
| 3 | 3(2)/2 | 3 | Small Team |
| 4 | 4(3)/2 | 6 | Valley |
| 5 | 5(4)/2 | 10 | Valley |
| 6 | 6(5)/2 | 15 | Valley |
| 7 | 7(6)/2 | 21 | Valley |
| 8 | 8(7)/2 | 28 | Team |
| 9 | 9(8)/2 | 36 | Team |
| 10 | 10(9)/2 | 45 | Team |
| 11 | 11(10)/2 | 55 | Team |
| 12 | 12(11)/2 | 66 | Team (Ceiling) |
| 13 | 13(12)/2 | 78 | ⚠️ Threshold |
| 14 | 14(13)/2 | 91 | ⚠️ Threshold |
| 15 | 15(14)/2 | 105 | 🔴 Graveyard |
| 20 | 20(19)/2 | 190 | 🔴 Graveyard |
| 39 | 39(38)/2 | 741 | 🔴 Graveyard (upper bound) |

**Key Threshold:** 66 pathways (12 people) = maximum founder-manageable complexity without management layers.
```
*bootloader.md:5112-5132, verbatim*

### 97/3 and 96/4/0.4 (two different stats; do not mix them)

```
| Family | Values | Meaning | Source |
|--------|--------|---------|--------|
| Lifecycle population | 96 / 4 / 0.4 | Who *reaches* which destination (96% stay small, 4% reach Team, 0.4% reach Team of Teams) | Harnish revenue thresholds, mapped to his clusters |
| Structural classification | 97 / 3 | Who would *pass* VC evaluation (97% wouldn't, 3% would) — this is classification, not judgment | Author-derived (§5.2.1) |

*Usage: "Reach/cross" verbs take the first family; "pass/evaluate" verbs take the second.*
```
*bootloader.md:131-136, verbatim*

The terrain behind the first family (Harnish's data):

```
| ~28 million firms in the US | The population |
| Only 4% ever reach $1M in revenue | First major threshold |
| Only 0.4% ever reach $10M in revenue | Second major threshold |
| Only 17,000 companies surpass $50M | The rarified air |
```
*bootloader.md:1236-1239, verbatim*

So "97% / 3%" is about **who would pass VC evaluation**. "96% stay small / 4% reach Team" is about
**who reaches which destination**. Never write "97% never reach...".

### The receipt: what the founder takes home at 12 people

```
| At 12 Employees | Bought Scale (Profit First) | Rented Scale (USD Recalibration) |
|-----------------|-----------------------------|---------------------------------|
| Profit | 10% / $300K | 15% / $450K |
| Owner's Pay | 10% / $300K | 30% / $900K |
| Total to Founder | $600K | $1.35M |
```
*bootloader.md:3649-3653, verbatim*

These numbers are not automatic. They require the "Conditions Box" (founder-led sales, zero middle
management, and so on; bootloader.md:1190-1201): "The recalibration isn't a promise. It's a target—achievable only when operating conditions match rented-scale physics." (bootloader.md:1216)

### Vehicles

```
| Vehicle | Engine | Speed | Capacity | Founder Role | Resilience |
|---------|--------|-------|----------|--------------|------------|
| **Bicycle** | You pedal | Your speed | Just you | You ARE the engine | Zero—you stop, it stops |
| **Car** | Small engine + you | Faster than bicycle | Small team | Driver + sometimes pusher | Low—needs you most of the time |
| **Limousine** | Engine runs itself | Consistent | Team + systems | Passenger who gives directions | Medium—runs without you for periods |
| **Airplane** | Multiple engines | Fastest | Large capacity | Occasional pilot | High—institutional resilience |
```
*bootloader.md:3564-3569, verbatim*

### Library, not Pile: the compounding math

```
| Cycle | Effort | Output | Why |
|-------|--------|--------|-----|
| First launch | 100% | 100% | Building from scratch |
| Second launch | 80% | 120% | Systems stronger |
| Third launch | 60% | 140% | Processes refined |
| Fourth launch | 40% | 160% | Institutional depth |
```
*bootloader.md:2634-2639, verbatim*

### Closed system against open system (the AI beat)

```
| Closed System | Open System |
|---------------|-------------|
| Finite components | Infinite expansion |
| Rules constrain behavior | Rules are suggestions |
| "Does this fit?" is a real question | Everything can be added |
| AI accelerates clarity | AI accelerates chaos |
```
*bootloader.md:4754-4759, verbatim*

### Time gets slower as the team grows (Time Dilation)

```
| Team Size | Mini USD Cycle | Up | Side | Down | Planning Cadence |
|-----------|----------------|-----|------|------|------------------|
| 1-3 | USD 1-3 | 3 days | 1 day | 1 day | Weekly |
| 4-6 | USD 4-6 | 1 week | 1 week | 1 week | Bi-weekly |
| 7-9 | USD 7-9 | 1 month | 1 month | 1 month | Monthly |
| 10-12 | USD 10-12 | 1 quarter | 1 quarter | 1 quarter | Quarterly |
```
*bootloader.md:159-164, verbatim*

### Proof from the book: the same author's two launches (the current site's proof block)

```ts
    title: "Two launches of Izabella's books",
    items: [
      { n: "40", tone: "down", label: "People · #1 New York Times", title: "Hashimoto's Protocol" }, // L3459; forty people, L968
      { n: "12", tone: "up", label: "People · Publishers Weekly bestseller", title: "Adrenal Transformation Protocol" }, // L3461 (all with twelve people)
    ],
    close: "The contrast wasn't the ranking. The contrast was the cost.", // L3463
```
*src_copy.ts lines 202-207 (file lines, not manuscript lines), verbatim*

### The Bootloader as an object

- Version: "SUSD_Bootloader_V16 (October 2026)" (bootloader.md:747)
- 35,445 words, 284 KB, served at /bootloader.md (project record, Oct 29). About 47,000 tokens (discovery call).
- It begins with an exact starting prompt (bootloader.md:221-223) and a "Canonical Prompt (For Users)" (bootloader.md:400-417).
- The book prints scalingupsidedown.com/appendix.

### Other countable pieces (bootloader.md:6305-6323)

3 Companies (Today / Tomorrow / Toys) · 3 Inversions · 4 Destinations · 5 Scoreboard questions ·
6 Quarterly questions · 14-day Limousine test · 15 = Graveyard entry · 60-day Circuit Breaker · 90-day cycle.

---

## 6. Above the fold: three line-ups built only from checked quotes

The test: in five seconds a visitor should know **what the book says**, **who it is for**, and
**whether they want it**. Each option is a big line, a support line, and the entry question, with the
book and the Bootloader as the two actions. Labels and buttons are free text.

**A. The title explains itself**
- Big: "Real scaling is cyclical. Up for growth. Side for stability. Down for pruning." (bootloader.md:795) (the first four sentences of that cell)
- Support: "Every hire compounds complexity before it compounds capacity." (copy.ts L696)
- Ask: "How many people are on your team?" (bootloader.md:310)

**B. The diagnosis**
- Big: "Most founders think they're scaling. They're not." (bootloader.md:794)
- Support: "There are two kinds of growth. You inherited the wrong map." (bootloader.md:838)
- Ask: the team-size question, then answer by band.

**C. The relief**
- Big: "You were never the problem. The model you inherited was." (copy.ts L216)
- Support: "Complexity > Capacity = Redline." (copy.ts L2997) / "Capacity > Complexity = Oxygen." (copy.ts L2999)
- Ask: the team-size question.

Each option then pays off with the band answer, the Up / Side / Down cycle, the 12 systems, and the
two choices: "The pages are reference. The file is the operating system." (copy.ts L4497)

---

## 7. Cautions for anyone writing or designing with this

1. **Copy rule:** whole sentences only, word for word. Do not trim a quote mid-sentence, and do not join
   two quotes as if they were adjacent unless the source shows them together.
2. **97/3 against 96/4/0.4:** see section 5. "Pass/evaluate" takes 97/3; "reach/cross" takes 96/4/0.4 (bootloader.md:136).
3. **The Graveyard is 15-39** (Threshold 13-14). The current site's trap kicker says "12–40 people"
   (`copy.ts L3562`). That is the manuscript's own wording, but it differs from the Bootloader's canon.
   Pick one deliberately.
4. **12 is a cap, not a target.** "12 is a cap, not a target. A six-system business does not inflate toward twelve." (bootloader.md:186)
5. **Cyclical Growth is not "slow", "sustainable" or "lifestyle" growth** (bootloader.md:874-885).
   "This framework is not anti-growth." (bootloader.md:447)
6. **Locked vocabulary** (bootloader.md:3948-4040): Up / Side / Down; The Graveyard; Team of Teams; Rented
   Scale / Bought Scale; Today / Tomorrow / Toys; Cyclical Growth / Linear Growth. Do not swap in synonyms
   such as "danger zone", "growth phase" or "sustainable growth".
7. **The Bootloader is a file/spec**, delivered by email opt-in, shown with its version and word count.
   It is not "copy the prompt" (Michael, Oct 27; CLAUDE.md).
8. **Team = coordination load**, and it counts the founder (bootloader.md:312, 3390).
9. **What to avoid:** visuals where the message sits beside the picture in small, left-aligned text. James's
   note tonight: people look at the blocks and don't read the text. The words above are the subject; set
   them as the picture.
