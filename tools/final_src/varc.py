"""Final Stretch VARC papers: 4 papers x 24 questions in the CAT 2023/2025 pattern
(4 RC passages x 4 = 16; 2 para-jumbles (TITA), 2 odd-one-out (TITA), 2 summaries, 2 sentence placements).
All passages are original. RC tuple: (stem, options, answer, explanation[, difficulty])."""
P = []
def paper(): P.append([])
def rc(title, d, paras, qs): P[-1].append(dict(k="rc", title=title, d=d, paras=paras, qs=qs))
def pj(d, c, e): P[-1].append(dict(k="pj", d=d, c=c, e=e))
def ooo(d, c, x, e): P[-1].append(dict(k="ooo", d=d, c=c, x=x, e=e))
def ps(d, p, o, a, e): P[-1].append(dict(k="ps", d=d, p=p, o=o, a=a, e=e))
def sp(d, s, p, a, e): P[-1].append(dict(k="sp", d=d, s=s, p=p, a=a, e=e))

# =====================================================================  PAPER 1
paper()
rc("The quiet arithmetic of nudges", "m", [
"When governments discovered behavioural economics, they discovered a cheap instrument. A tax requires legislation and a subsidy requires money, but a change in the default option on a pension form requires only a printer. Enrolment in workplace savings schemes rose sharply wherever employees were enrolled automatically and allowed to opt out, rather than asked to opt in. The lesson seemed to be that people are not so much irrational as inert, and that a well-designed form could do the work once assigned to persuasion.",
"The enthusiasm that followed was understandable, and some of it was deserved. Yet the early results came from a narrow class of decisions: those taken once, on paper, by people who had no strong preference either way. Defaults work best precisely where people care least. When the decision matters to them, or when it must be repeated daily, the nudge tends to fade. A reminder to take medication improves adherence for a few weeks; a smaller plate reduces what is eaten at one meal but not, it seems, what is eaten in a week. Behaviour bends towards the nudge and then, quietly, bends back.",
"There is also a problem of arithmetic. A nudge that raises the rate of some desirable behaviour by two percentage points can be reported as a large proportional effect if the base rate was low, and studies with striking results are more likely to be published than those with none. When researchers later collected every trial run by two government ‘nudge units’, including the unpublished ones, the average effect was roughly a sixth of what the academic literature had suggested. The effects were real; they were simply small.",
"None of this makes nudges useless. A small effect that costs almost nothing can still be a bargain, and a default that adds a few per cent to retirement savings, compounded over decades, is not trivial. The danger lies elsewhere: in the temptation to treat the cheap instrument as a substitute for the expensive one. A government that nudges citizens to save while leaving wages stagnant, or that redesigns the menu while ignoring the price of fresh food, has mistaken a tool for adjusting choices at the margin for a policy that changes the conditions under which choices are made."],
[("The author's main argument is that nudges",
  ["are effective but modest, and should not replace policies that change underlying conditions", "work only on irrational people and therefore have limited policy value", "were never effective and owe their reputation to selective publication", "should be preferred to taxes and subsidies because they cost almost nothing"],
  "are effective but modest, and should not replace policies that change underlying conditions",
  "Paragraph 3 says the effects are ‘real; they were simply small’, and paragraph 4 warns against treating nudges as a ‘substitute for the expensive one’. The third option overstates (the author says effects are real); the fourth reverses the warning.\nPassage signal: medium — clear structure (claim, limits, arithmetic, verdict). A good second passage."),
 ("Which of the following, if true, would most weaken the author's claim about decisions ‘repeated daily’?",
  ["A one-time redesign of a cafeteria layout kept reducing sugary-drink purchases for three years", "A pension default raised enrolment among new employees but not among existing ones", "Most published nudge studies measure outcomes within a month of the intervention", "People who opt out of a default usually have strong preferences about the decision"],
  "A one-time redesign of a cafeteria layout kept reducing sugary-drink purchases for three years",
  "The author says nudges on repeated choices ‘fade’. A lasting effect on a daily, repeated choice (buying drinks) directly contradicts that. The third option, if anything, fits the author's suspicion; the second and fourth concern one-off decisions."),
 ("According to the passage, the gap between the academic literature and the nudge units' full set of trials is best explained by",
  ["the tendency to publish striking results and to report effects in proportional terms", "the nudge units testing weaker interventions than academic researchers did", "academic studies being run on decisions that people care about", "the nudge units deliberately understating their results"],
  "the tendency to publish striking results and to report effects in proportional terms",
  "Paragraph 3 names exactly two mechanisms: proportional reporting on low base rates and publication bias. The other options are not stated."),
 ("All of the following are consistent with the passage EXCEPT:",
  ["Defaults have their strongest effect on decisions that people care most about.", "A small effect at very low cost can be worthwhile.", "A reminder may change behaviour only for a limited period.", "Nudges are cheaper to introduce than taxes or subsidies."],
  "Defaults have their strongest effect on decisions that people care most about.",
  "The passage says the opposite: ‘Defaults work best precisely where people care least.’ The other three are stated in paragraphs 1, 2 and 4.\nEXCEPT questions: check each option against one line of the passage; the one that reverses a line is the answer.")])

rc("Mining the abyss", "e", [
"The deep seabed, four to six kilometres down, is strewn in places with potato-sized nodules rich in manganese, nickel, cobalt and copper — metals that batteries for electric vehicles require in growing quantities. To mining companies the nodules look like the ideal ore: they lie loose on the surface, need no blasting and contain several valuable metals at once. To many marine biologists they look like something else: the only hard surface for hundreds of kilometres on an otherwise soft plain of mud, and therefore the anchor for most of the animals that live there.",
"Very little is known about those animals. Surveys of one nodule field in the Pacific found that the majority of the species collected had never been described, and that many were known from a single specimen. Life in the abyss runs slowly. Nodules themselves grow by a few millimetres every million years, and communities disturbed by test mining in the 1980s had still not recovered when scientists returned decades later. Removing the nodules removes the habitat on a timescale that, for practical purposes, is permanent.",
"Supporters of seabed mining reply that every source of metal has a cost. Mines on land clear forests, displace communities and leave behind toxic tailings; the deep sea, they argue, has no people to displace and no forests to clear. If the world needs these metals to decarbonise, the question is not whether to damage some ecosystem but which one.",
"The argument is serious, but it assumes that demand is fixed. Battery chemistries are changing quickly, and several now in commercial use need no cobalt or nickel at all. Recycling, too, could supply a growing share of demand as the first generation of electric cars reaches the scrapyard. The case for opening a new frontier of extraction is therefore weakest exactly where it claims to be strongest: in the confident forecast of what the world will need in twenty years."],
[("Why do marine biologists see the nodules differently from mining companies?",
  ["The nodules provide the hard surface on which much of the deep-sea life depends", "The nodules contain fewer valuable metals than companies claim", "The nodules are the only source of food in the deep sea", "Mining the nodules would release toxic metals into the water"],
  "The nodules provide the hard surface on which much of the deep-sea life depends",
  "Paragraph 1: ‘the only hard surface … the anchor for most of the animals that live there’.\nPassage signal: easy — concrete science, plain vocabulary, detail questions. Do this one first."),
 ("The author mentions the test mining of the 1980s in order to",
  ["show that damage to the deep seabed lasts for decades at least", "argue that test mining should be banned", "suggest that scientists have studied the abyss for a long time", "show that the nodules grow back faster than expected"],
  "show that damage to the deep seabed lasts for decades at least",
  "The example supports the claim that habitat loss is ‘for practical purposes … permanent’."),
 ("Which of the following best describes the author's response to the supporters of seabed mining?",
  ["It questions their assumption that future demand for these metals is certain", "It rejects their claim that mines on land cause harm", "It agrees that the deep sea is the least harmful source of metals", "It argues that no ecosystem should ever be damaged for metals"],
  "It questions their assumption that future demand for these metals is certain",
  "Paragraph 4: ‘it assumes that demand is fixed’, then cites new battery chemistries and recycling. The author calls their argument ‘serious’ and does not deny land-mining harms."),
 ("Which of the following can be inferred from the passage?",
  ["A rise in battery recycling would weaken the case for seabed mining", "Most deep-sea species are found only on manganese nodules", "Electric vehicles can no longer be built without cobalt", "Mines on land cause less damage than mining on the seabed"],
  "A rise in battery recycling would weaken the case for seabed mining",
  "Recycling reduces the need for new metal, which undercuts the demand forecast the miners rely on. The second option goes beyond the passage (most animals anchor on nodules; ‘found only on’ is not stated); the third contradicts paragraph 4.")])

rc("The forger's question", "h", [
"In 1945 the Dutch painter Han van Meegeren, accused of having sold a national treasure — a Vermeer — to Hermann Göring, defended himself by proving that the painting was not a Vermeer at all. He had painted it himself, and to demonstrate the point he painted another in front of witnesses. The charge of collaboration collapsed into a charge of fraud, and the paintings that critics had praised as among Vermeer's finest were quietly taken off the walls.",
"The episode poses a question that is easy to state and hard to answer. If a painting is admired for its beauty, and the painting does not change, why should its value collapse when its authorship does? One answer, popular among aesthetic formalists, is that it should not: what matters is what is visible on the canvas, and the shock of discovery reveals only the snobbery of those who had praised a name. On this view the forgery exposes the critic, not the painting.",
"The formalist answer has the virtue of consistency, but it misdescribes what we admire in a work of art. A painting is not only an arrangement of pigments; it is also an achievement, and achievements are relative to their circumstances. To have solved, in the 1660s, the problem of rendering light falling through a window onto a wall is one thing; to imitate that solution three centuries later, once it is known to be possible, is another. The two canvases may look alike, but they are not answers to the same question. What the forgery lacks is not a visible property but a historical one, and historical properties are no less real for being invisible.",
"This does not mean that the forger's skill counts for nothing. Van Meegeren's paintings deceived experts, and deception of that order is itself an achievement, though not an artistic one of the kind the paintings claimed. It means only that the question ‘is it beautiful?’ and the question ‘what has been done here?’ are different questions, and that our responses to art have always depended on both. The scandal of a forgery lies in having the second question answered falsely."],
[("The formalist view described in the passage holds that",
  ["a painting's value should depend only on what can be seen in it", "a forgery deserves more admiration than the original", "authorship is the main source of a painting's value", "critics are usually right about the beauty of paintings"],
  "a painting's value should depend only on what can be seen in it",
  "Paragraph 2: ‘what matters is what is visible on the canvas’.\nPassage signal: hard — abstract argument, a view described and then rebutted, careful wording in the options. Leave it for last unless the other passages are worse."),
 ("The author's main objection to the formalist view is that it",
  ["ignores that a work of art is also an achievement relative to its historical circumstances", "cannot explain why experts were deceived by van Meegeren", "treats forgers as more skilled than they are", "depends on the snobbery of critics"],
  "ignores that a work of art is also an achievement relative to its historical circumstances",
  "Paragraph 3: ‘it is also an achievement, and achievements are relative to their circumstances.’ The last option is the formalist's charge against critics, not the author's objection to formalism."),
 ("Which of the following situations is most similar to the author's point about the two canvases?",
  ["A proof of an old theorem written today by a student who has read the original proof", "Two photographs of the same landscape taken on different days", "A translation of a novel that is more popular than the original", "A copy of a painting that is labelled as a copy in a museum"],
  "A proof of an old theorem written today by a student who has read the original proof",
  "The student's proof may look identical on the page, but it does not answer the same problem: the original solved something not yet known to be solvable. That matches ‘not answers to the same question’. The labelled copy makes no false claim about achievement, so it misses the point."),
 ("According to the author, the ‘scandal of a forgery’ lies in",
  ["a false answer to the question of what was achieved", "the poor technical quality of the forged work", "the damage it does to the reputation of the original artist", "the fact that it is not beautiful once its origin is known"],
  "a false answer to the question of what was achieved",
  "Last sentence: ‘The scandal of a forgery lies in having the second question answered falsely’ — the second question being ‘what has been done here?’", "m")])

rc("The monsoon's merchants", "m", [
"Long before European ships entered the Indian Ocean, its trade ran on a timetable set by the wind. From roughly April to September the south-west monsoon carried ships from the coasts of Arabia and East Africa towards India; from November to February the north-east monsoon carried them back. A merchant who missed the season could wait months for the next one, and port cities grew up as places to wait as much as places to trade.",
"This rhythm shaped the communities that lived by it. Because voyages were long and returns slow, traders settled for months or years in foreign ports, married locally and formed diasporas — Gujaratis in East Africa, Arabs on the Malabar coast, Chinese in the ports of Southeast Asia. Credit travelled along these networks of kin and faith; a promissory note written in Cairo might be honoured in Aden or Calicut because the people at each end belonged to the same community. Trust, rather than any state, guaranteed the contracts.",
"Historians once described this world as a set of local trades waiting to be unified by Europeans. The Portuguese, arriving in 1498, certainly tried: they built forts, demanded passes from Asian ships and attempted to monopolise the trade in pepper. But their success was partial. Most of the ocean's commerce continued in Asian hands for another two centuries, often simply by avoiding Portuguese forts. What changed the ocean more decisively was not the cannon but the joint-stock company, which could raise capital from thousands of investors and wait for returns longer than any family firm.",
"The monsoon world was thus neither a timeless tradition nor a primitive stage of globalisation. It was a sophisticated system of exchange adapted to its constraints: seasonal winds, long distances, and the absence of any single authority over the sea. Its decline is a reminder that what displaces a system is not always the force that most visibly attacks it."],
[("According to the passage, why did port cities in the Indian Ocean become ‘places to wait’?",
  ["Ships could sail only in certain seasons, so traders who missed one had to stay until the next", "Portuguese forts forced ships to wait for passes", "Merchants needed time to obtain credit from local rulers", "Goods had to be stored until prices rose"],
  "Ships could sail only in certain seasons, so traders who missed one had to stay until the next",
  "Paragraph 1 links the waiting to the monsoon timetable.\nPassage signal: medium — history with a clear argument; the last question asks for the main point."),
 ("The passage suggests that credit could travel between distant ports mainly because",
  ["traders at both ends belonged to the same networks of kin and faith", "states enforced contracts across the ocean", "the Portuguese issued passes that guaranteed payment", "joint-stock companies financed the trade"],
  "traders at both ends belonged to the same networks of kin and faith",
  "Paragraph 2: ‘Trust, rather than any state, guaranteed the contracts.’"),
 ("The author's view of the Portuguese impact on Indian Ocean trade is that it was",
  ["limited, since most trade stayed in Asian hands for two more centuries", "decisive, since they monopolised the pepper trade", "negligible, since they never built forts", "beneficial, since they unified local trades"],
  "limited, since most trade stayed in Asian hands for two more centuries",
  "‘Their success was partial.’ They did build forts and tried to monopolise pepper, so ‘negligible’ and ‘decisive’ both miss."),
 ("Which of the following best expresses the point of the last sentence of the passage?",
  ["The joint-stock company, not armed attack, did more to transform the monsoon trade", "The monsoon world declined because it was primitive", "European cannons destroyed the Asian trading networks", "Systems of exchange always decline when they are attacked"],
  "The joint-stock company, not armed attack, did more to transform the monsoon trade",
  "The ‘force that most visibly attacks it’ is the Portuguese cannon; what displaced the system was the joint-stock company (paragraph 3). The second option contradicts paragraph 4.")])

pj("m", ["Most people assume that a good memory works like a recording, storing events as they happened.",
         "Research over the past half-century suggests something quite different: each time we recall an event, we rebuild it from fragments.",
         "In the rebuilding, details from later experience, from conversation and even from suggestion can slip in.",
         "This is why confident eyewitnesses can be sincerely, and dangerously, wrong."],
   "{1} states the common assumption. {2} contradicts it (‘something quite different’). {3} explains what happens ‘in the rebuilding’ that {2} introduced. {4} draws the consequence (‘This is why’).")
ooo("m", ["Cities have long been treated as the enemies of wildlife.",
          "Yet a growing number of species are not merely surviving in cities but adapting to them.",
          "Urban birds in several countries now sing at a higher pitch, to be heard over traffic.",
          "Some city lizards have evolved stickier toe pads that help them cling to smooth walls and glass."],
    "Rising rents in city centres have pushed many families into the suburbs.",
    "{1}–{4} describe wildlife adapting to cities: the claim and two examples. {x} is about human housing costs — same setting, different subject.")
ps("m", "A language does not die when its last speaker dies; it dies when parents stop passing it to their children. By the time a language has only elderly speakers, its fate has usually been decided a generation earlier, in countless private decisions by families who judged that their children's prospects lay in another tongue. Efforts to revive such languages therefore succeed less through dictionaries and archives than through schools, media and economic incentives that make the language worth passing on.",
   ["A language survives only if families pass it on, so revival must make the language worth passing on rather than merely record it.", "Languages die when their last speakers die, and archives can preserve them.", "Parents should be required to teach their children endangered languages.", "Dictionaries and archives are useless for endangered languages."],
   "A language survives only if families pass it on, so revival must make the language worth passing on rather than merely record it.",
   "The paragraph moves from the real cause of language death (families stop passing it on) to what that means for revival. The fourth option turns ‘succeed less through’ into ‘useless’.")
sp("m", "Economists call this the rebound effect.",
   "When a technology makes a resource cheaper to use, we expect consumption of that resource to fall. (1) More efficient engines, for example, should mean less fuel burned. (2) Often the opposite happens: cheaper running costs encourage people to drive more, or to buy larger cars, and total consumption rises. (3) It does not mean that efficiency is pointless, only that its benefits depend on what people do with the money and effort it frees. (4)",
   3,
   "‘This’ needs the phenomenon just described — consumption rising despite efficiency — which is complete only at (3). The next sentence, ‘It does not mean…’, needs a named effect for ‘It’ to refer to. At (2) nothing has rebounded yet; at (4) ‘It’ would have no referent.")
pj("h", ["The idea that scientists should ‘follow the data’ sounds unarguable.",
         "But data do not arrive labelled with the questions they answer.",
         "Someone has to decide what to measure, how to measure it and what counts as an anomaly worth chasing.",
         "Those decisions are shaped by theory, so the data a scientist follows are already partly of her own making."],
   "{1} states a slogan. {2} challenges it (‘But’). {3} explains why data need decisions. {4} concludes that ‘those decisions’ (from {3}) are shaped by theory.")
ooo("h", ["Translation has often been described as a betrayal of the original.",
          "Every language divides the world differently, so no word carries exactly the same load in another tongue.",
          "A translator must therefore choose what to sacrifice: rhythm, ambiguity, connotation or literal sense.",
          "Seen this way, translation is less a copy than a series of interpretive decisions."],
    "Machine translation now handles routine business correspondence with few errors.",
    "{1}–{4} argue that translation involves unavoidable choices: the old charge, the reason, the consequence and the reframing. {x} shifts to the accuracy of machine translation.")
ps("h", "Museums like to describe their collections as belonging to humanity. The phrase is generous, but it can also be convenient. An object taken from a colony and displayed in a European capital may indeed be seen by more people there than at home; that does not settle who should decide its fate. To say that something belongs to everyone can be a way of saying that it belongs, in practice, to whoever already holds it.",
   ["Calling collections the property of humanity can hide the question of who controls them, which usually favours their current holders.", "Museums in Europe attract more visitors than those in former colonies.", "Objects should be returned only if more people would see them at home.", "All museum collections were acquired unfairly."],
   "Calling collections the property of humanity can hide the question of who controls them, which usually favours their current holders.",
   "The point is in the last sentence: talk of universal ownership can mask control by the holder. The second option is a supporting detail; the fourth overgeneralises.")
sp("m", "Ironically, the cure became part of the problem.",
   "For decades, cities tried to ease traffic by building more roads. (1) New lanes did reduce congestion — for a while. (2) Then drivers who had avoided the road at peak hours returned, new housing grew up along the route, and the traffic came back. (3) Planners now speak of ‘induced demand’: extra capacity creates the traffic that fills it. (4) Some cities have begun to remove roads altogether and found, to their surprise, that traffic simply adjusts.",
   3,
   "The sentence says the remedy (more roads) fed the problem. It fits at (3): after traffic comes back and before the planners' name for that effect. At (1) or (2) the cure has not yet failed.")

# =====================================================================  PAPER 2
paper()
rc("Who wrote this?", "m", [
"For most of history the question ‘who wrote this?’ had a simple answer, even when it was hard to discover. A text was the product of a mind, and the mind belonged to a person who could be praised, paid, sued or imprisoned for it. Copyright law, literary criticism and the ordinary ethics of plagiarism all rest on that assumption. Large language models unsettle it, not because they write well — many do not — but because they make it hard to say where a piece of writing came from.",
"Consider a report drafted by a model from a two-line prompt, then revised by a person who rewrites a third of it. The person chose the topic and approved the result; the model produced most of the sentences; and the model itself was shaped by millions of texts written by people who will never be credited. Each of the familiar candidates for authorship has a partial claim, and none has a complete one.",
"One response is to insist that authorship belongs to whoever takes responsibility. A newspaper editor does not write every headline, but answers for all of them. On this view the question is not who produced the words but who stands behind them, and the person who submits the report is its author whatever tools were used. The response has practical appeal: it tells institutions whom to hold accountable.",
"But responsibility and authorship have never been quite the same thing. We hold publishers responsible for what they print without calling them authors, and we credit authors for books they were too ill to defend. Authorship has also meant a claim to a certain kind of effort and originality — the claim that the work reflects a particular mind's way of seeing. It is this second meaning, rather than legal accountability, that the new tools put in doubt, and it is unlikely to be settled by rules about disclosure alone."],
[("The author's main concern in the passage is",
  ["how text generators blur authorship, especially authorship as the expression of a particular mind", "whether large language models write better than people", "how copyright law should punish plagiarism by machines", "why newspaper editors should be treated as authors"],
  "how text generators blur authorship, especially authorship as the expression of a particular mind",
  "Paragraph 1 states the problem; paragraph 4 says it is the ‘second meaning’ of authorship that is in doubt. The passage says the issue is ‘not because they write well’.\nPassage signal: medium — topical AI passage (AI appeared in both 2024 and 2025); the last paragraph is abstract."),
 ("The example of the report in the second paragraph is used to show that",
  ["several parties have partial but incomplete claims to authorship", "the person who revises a text is always its author", "language models produce most of the writing in offices", "prompts are the most creative part of writing with a model"],
  "several parties have partial but incomplete claims to authorship",
  "‘Each of the familiar candidates for authorship has a partial claim, and none has a complete one.’"),
 ("Which of the following, if true, would best support the author's argument in the final paragraph?",
  ["Readers who learn that a poem was machine-generated rate it lower even when they cannot tell the difference", "Most institutions now require staff to disclose their use of AI tools", "Newspaper editors are often sued for headlines they did not write", "Language models are trained on texts written in many languages"],
  "Readers who learn that a poem was machine-generated rate it lower even when they cannot tell the difference",
  "This shows that people value authorship as a mind's effort and vision, separate from the text and from accountability. The second option is about disclosure rules, which the author says will not settle the issue; the third is about responsibility."),
 ("All of the following are stated or implied in the passage EXCEPT:",
  ["Holding someone responsible for a text is the same as calling them its author.", "Copyright law assumes that a text comes from an identifiable person.", "The writers of a model's training texts are usually not credited.", "Rules about disclosure may not resolve the question of authorship."],
  "Holding someone responsible for a text is the same as calling them its author.",
  "Paragraph 4 opens: ‘responsibility and authorship have never been quite the same thing.’ The other three are stated in paragraphs 1, 2 and 4.")])

rc("Shade as infrastructure", "e", [
"On a summer afternoon the centre of a large city can be several degrees hotter than the countryside around it. Asphalt and concrete absorb sunlight during the day and release it at night; air conditioners pump heat from buildings into the street; and there is little vegetation to cool the air by evaporation. Scientists call the result an urban heat island, and as heatwaves become longer and more frequent it is becoming a public-health problem rather than a curiosity.",
"The heat is not shared equally. Within the same city, neighbourhoods with tree-lined streets and parks can be markedly cooler than those dominated by car parks and flat roofs, and the hotter districts are often the poorer ones. Residents there are less likely to have air conditioning and more likely to work outdoors. When a heatwave strikes, the excess deaths cluster in such places.",
"Trees are among the most effective remedies. A mature tree shades the pavement and the walls beneath it, and the water it releases through its leaves cools the surrounding air. Yet cities often treat trees as decoration — something to be planted when budgets allow and removed when a road needs widening. Young trees are planted without the care needed to keep them alive through their first dry summers, and many die within a few years.",
"A growing number of planners argue that shade should be treated as infrastructure, like drains or streetlights: planned, maintained and distributed according to need. The argument is partly economic. A tree costs little to plant but takes decades to reach full size, so the benefits arrive slowly and are easily ignored in annual budgets. Cities that wait for a heatwave before planting will find that the trees they need should have been planted twenty years earlier."],
[("Which of the following is NOT given in the passage as a cause of the urban heat island?",
  ["Tall buildings blocking the wind", "Heat released at night by asphalt and concrete", "Air conditioners pushing heat into streets", "A lack of vegetation that cools the air"],
  "Tall buildings blocking the wind",
  "Paragraph 1 lists the other three. Wind is never mentioned.\nPassage signal: easy — science-and-policy passage with concrete details. Do it first."),
 ("The passage suggests that poorer districts suffer more during heatwaves because",
  ["they tend to be hotter and their residents are less able to protect themselves from heat", "they have more trees, which use up water", "they are further from the city centre", "their residents refuse to use air conditioning"],
  "they tend to be hotter and their residents are less able to protect themselves from heat",
  "Paragraph 2: hotter districts are often poorer, and their residents are less likely to have air conditioning and more likely to work outdoors."),
 ("The author's criticism of how cities treat trees is that they",
  ["regard trees as optional decoration rather than essential services", "plant too many trees in wealthy areas", "spend too much on maintaining old trees", "plant trees that are unsuited to the climate"],
  "regard trees as optional decoration rather than essential services",
  "Paragraph 3: ‘cities often treat trees as decoration’."),
 ("Why, according to the passage, are the benefits of trees ‘easily ignored in annual budgets’?",
  ["The costs come at once while the benefits build up over decades", "Trees are more expensive to plant than drains", "The benefits of trees cannot be measured", "Annual budgets do not include public-health spending"],
  "The costs come at once while the benefits build up over decades",
  "Paragraph 4: ‘A tree costs little to plant but takes decades to reach full size, so the benefits arrive slowly’.")])

rc("The obligation in the gift", "h", [
"Anthropologists have long been fascinated by societies in which gifts, rather than markets, organise much of economic life. In the classic accounts, a gift is never simply given. It creates an obligation to receive it, and then an obligation to return it, usually with something of greater value and usually after a delay. A gift returned at once, or with something of exactly equal worth, would be an insult: it would turn a relationship into a transaction and announce that the parties wished to owe each other nothing.",
"From this observation it was tempting to draw a contrast between two kinds of society. In one, exchange binds people together through endless cycles of debt; in the other, the market lets strangers trade and walk away. The first was romanticised as warm and communal, the second deplored as cold and individualist, and the gift became a symbol of everything modern life had lost.",
"The contrast is too neat. Gift economies could be fiercely competitive: in some, rivals ruined themselves to give away more than their opponents, and the obligation to return a gift could be a heavy burden on those unable to meet it. Debt, after all, is a form of hierarchy, and the person who cannot repay is placed below the person who gave. Conversely, markets have never been as impersonal as the theory suggests. Traders cultivate regular customers, extend credit to those they know and give small gifts to keep a relationship alive.",
"What the anthropology of the gift shows, then, is not that one kind of society is better than another, but that every economy mixes two logics — the logic of settling accounts and the logic of keeping them open. The question worth asking of any society is how it decides which relationships should be closed by payment and which should be left, deliberately, in debt."],
[("According to the passage, returning a gift at once with something of equal value would be insulting because it",
  ["signals a wish to end the relationship of mutual obligation", "shows that the receiver is poorer than the giver", "breaks the rules of market exchange", "makes the original gift seem worthless"],
  "signals a wish to end the relationship of mutual obligation",
  "Paragraph 1: it ‘would turn a relationship into a transaction and announce that the parties wished to owe each other nothing.’\nPassage signal: hard — anthropology, a contrast built up and then taken apart, an abstract conclusion."),
 ("The author mentions rivals who ‘ruined themselves to give away more’ in order to",
  ["show that gift economies could be competitive and burdensome rather than simply warm", "prove that gift economies were less efficient than markets", "argue that rivalry is natural in all societies", "illustrate the generosity of communal societies"],
  "show that gift economies could be competitive and burdensome rather than simply warm",
  "It is evidence against the romantic picture in paragraph 2."),
 ("Which of the following would the author most likely agree with?",
  ["A shopkeeper who gives a regular customer an unasked-for discount is keeping a relationship open", "Modern societies have lost the logic of the gift completely", "Gift economies were free of hierarchy", "Markets work only between strangers"],
  "A shopkeeper who gives a regular customer an unasked-for discount is keeping a relationship open",
  "Paragraph 3: traders ‘give small gifts to keep a relationship alive’; paragraph 4 calls this the logic of keeping accounts open. The other options are views the author rejects."),
 ("The ‘contrast’ that the author calls ‘too neat’ is between",
  ["communal societies bound by gift debts and individualist societies based on markets", "rich and poor members of a gift economy", "anthropologists and economists", "competitive and generous gift-givers"],
  "communal societies bound by gift debts and individualist societies based on markets",
  "The contrast is drawn in paragraph 2 and rejected at the start of paragraph 3.", "m")])

rc("Why accents survive", "m", [
"Every few decades someone predicts that radio, television or the internet will erase regional accents. The prediction keeps failing. Children who grow up watching the same programmes as children hundreds of kilometres away still sound like the people in their own streets. Linguists have a simple explanation: we learn to speak mainly from people we interact with, not from voices we merely hear. A television presenter never replies, and a child does not adjust her speech to win the presenter's approval.",
"Accents persist also because they do social work. An accent tells listeners where a speaker comes from, and often which class or community she belongs to. That information can count against her — speakers of stigmatised accents are routinely judged less intelligent or less competent — but it can also signal loyalty and belonging. Teenagers, in particular, often exaggerate the local features of their speech, as if to mark themselves off from both their parents and the standard of the classroom.",
"This does not mean that accents are fixed. They change constantly, and some changes spread remarkably quickly across cities and even countries. But the changes move through networks of people who talk to one another, especially young people, rather than descending from broadcasters. A new vowel sound may appear in a city's poorer districts and spread outwards among the young while the national media go on speaking as before.",
"The persistence of accents is thus a small lesson in how culture travels. Mass media can spread words, phrases and fashions with great speed, but the deeper patterns of how we speak are shaped by the people whose approval we seek. Exposure is not the same as influence."],
[("According to the passage, children do not adopt the accents of television presenters mainly because",
  ["they learn speech chiefly from people they interact with", "presenters speak with stigmatised accents", "children watch too little television", "accents are inherited"],
  "they learn speech chiefly from people they interact with",
  "Paragraph 1: ‘we learn to speak mainly from people we interact with, not from voices we merely hear.’\nPassage signal: medium — familiar topic, but the questions test the difference between exposure and influence."),
 ("The behaviour of teenagers described in the second paragraph suggests that accents",
  ["can be used to signal both belonging and separation", "are learned mostly in classrooms", "become weaker during adolescence", "are judged harshly only by older people"],
  "can be used to signal both belonging and separation",
  "Teenagers exaggerate local features ‘to mark themselves off from both their parents and the standard of the classroom’."),
 ("Which of the following is NOT supported by the passage?",
  ["Changes in accent usually start with national broadcasters and then spread to cities.", "Accents can lead listeners to make unfair judgements about speakers.", "Some changes in accent spread quickly across large areas.", "Young people play a large role in spreading new features of speech."],
  "Changes in accent usually start with national broadcasters and then spread to cities.",
  "Paragraph 3: changes move through networks ‘rather than descending from broadcasters’. The other three are stated."),
 ("The final sentence, ‘Exposure is not the same as influence’, most nearly means that",
  ["hearing a way of speaking does not make us adopt it unless we interact with its speakers", "the media have no influence on culture", "people avoid hearing accents different from their own", "influence on speech comes only from parents"],
  "hearing a way of speaking does not make us adopt it unless we interact with its speakers",
  "The paragraph grants that media spread words and fashions, so ‘no influence’ is too strong; the point is about the deeper patterns of speech.")])

pj("m", ["Early maps were not meant to be accurate in the modern sense.",
         "Many placed a holy city at the centre and filled the margins with monsters and marvels.",
         "Their purpose was to show the order of the world as their makers understood it, not to help a traveller find a road.",
         "Judged by that purpose, they were not failed attempts at precision but successful pictures of a belief."],
   "{1} makes the claim. {2} gives features that show it. {3} states the real purpose (‘Their purpose’). {4} judges the maps ‘by that purpose’.")
ooo("m", ["Sleep was once regarded as a period in which the brain simply switched off.",
          "We now know that the sleeping brain is busy, replaying the day's experiences and strengthening some memories.",
          "Waste products that build up in the brain during waking hours are also cleared more quickly during sleep.",
          "Seen in this light, cutting sleep short is not a saving of time but a cost to the brain's maintenance."],
    "Many people now track their sleep using watches and phone applications.",
    "{1}–{4}: the old view, two things the sleeping brain does, and the conclusion. {x} is about sleep-tracking gadgets, which the paragraph never discusses.")
ps("m", "We often praise people for ‘sticking to their principles’, as though changing one's mind were a sign of weakness. But a principle held regardless of evidence is not a virtue; it is a refusal to learn. The harder and more admirable thing is to hold views firmly enough to act on them and loosely enough to revise them when the facts change.",
   ["Holding views firmly enough to act on, yet being willing to revise them, is better than rigid consistency.", "People should never stick to their principles.", "Changing one's mind is always a sign of strength.", "Principles are less important than facts."],
   "Holding views firmly enough to act on, yet being willing to revise them, is better than rigid consistency.",
   "The paragraph balances two demands: firmness to act and openness to revise. The second and third options are extremes the author does not take.")
sp("m", "That changed when reliable marine chronometers made it possible to know the home-port time while at sea.",
   "For centuries sailors could find their latitude easily by measuring the height of the sun or the pole star. (1) Longitude was another matter. (2) Because the earth turns fifteen degrees an hour, a navigator who knew both local time and the time at his home port could calculate how far east or west he had travelled. (3) But pendulum clocks failed on a rolling ship, and errors of a few minutes meant errors of many kilometres. (4) Ships could at last be placed on the map with confidence, and fewer were wrecked on unexpected coasts.",
   4,
   "‘That changed’ needs a problem just before it: the failure of clocks at sea, described in the sentence before (4). Then ‘Ships could at last…’ follows naturally.")
pj("h", ["The distinction between weather and climate is simple to state.",
         "Weather is what happens on a given day; climate is the pattern of weather over decades.",
         "This is why a single cold winter tells us almost nothing about whether the climate is warming.",
         "To see a change in climate, one has to look past the noise of individual seasons to the trend beneath."],
   "{1} introduces the distinction; {2} defines it; {3} draws a consequence (‘This is why’); {4} says what one must do instead.")
ooo("h", ["A city's oldest buildings often survive not because they were valued but because nobody could afford to replace them.",
          "Districts that stagnated for decades kept their old houses while booming areas rebuilt again and again.",
          "When tastes later turned towards heritage, these neglected districts suddenly became the most desirable.",
          "Preservation, in other words, is sometimes an accident of poverty rather than an act of care."],
    "Modern architects increasingly use recycled materials in new buildings.",
    "{1}–{4} argue that old buildings often survived through neglect: claim, mechanism, later reversal, conclusion. {x} is about materials for new buildings.")
ps("h", "The success of a scientific theory is often taken as evidence that it is true. Yet the history of science is crowded with theories that worked well for generations before being abandoned. This does not show that science is unreliable; it shows that predictive success and truth are different things, and that a theory may be useful long before — and long after — we have reason to believe it is literally correct.",
   ["A theory's predictive success does not prove that it is true, though the theory may still be useful.", "Scientific theories are usually false and therefore useless.", "Successful theories are never abandoned.", "Science is unreliable because theories change."],
   "A theory's predictive success does not prove that it is true, though the theory may still be useful.",
   "The author separates success from truth and explicitly denies that science is unreliable. The second and fourth options are views the paragraph rejects.")
sp("h", "This is not a failure of memory but one of its functions.",
   "We tend to think of forgetting as the enemy of learning. (1) Yet a mind that kept every detail would struggle to see patterns, because each experience would remain distinct from every other. (2) By letting go of particulars, memory extracts what is general: the rule rather than the instance, the face rather than the angle at which we saw it. (3) Forgetting, in short, is part of how we learn. (4) Some researchers now suggest that the ability to forget well may be as important as the ability to remember.",
   3,
   "‘This’ must refer to letting go of particulars, described in the sentence just before (3). At (3) it bridges that description and the summary ‘Forgetting, in short, is part of how we learn.’")
