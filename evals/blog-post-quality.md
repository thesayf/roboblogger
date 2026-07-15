# Blog Post Quality Eval

Version: 1.0

Use this evaluation after research, writing, and image generation, but before the
post is saved or published. Evaluate the complete draft, not the plan or research
brief.

## Scoring

Score every criterion from 0 to 2.

- `0` - Unacceptable. The draft misses the criterion or creates material risk.
- `1` - Acceptable but ordinary. The draft meets the minimum and needs improvement.
- `2` - Strong. The draft clearly satisfies the criterion with specific evidence.

The draft passes when:

- The total score is at least 10 out of 12.
- No criterion scores 0.
- All deterministic checks pass.

Do not inflate scores to finish the task. Cite specific evidence from the draft
for every score. When the draft fails, revise the draft against the failed
criteria and deterministic issues, then evaluate the complete revised draft
again.

## Criteria

### 1. Audience and intent

Does the post answer the real question its intended reader has? Is it pitched at
the requested level of knowledge, with a useful outcome rather than a generic
overview?

Score 0 when the audience is wrong, the search intent is missed, or the post
mostly discusses an adjacent subject.

### 2. Thesis and original insight

Does the post make a clear, defensible argument? Does it reason from evidence and
mechanics instead of reproducing the standard internet summary? Are the examples,
comparisons, or recommendations specific enough to be memorable?

Score 0 when there is no discernible thesis or the article is interchangeable
with generic AI-generated content.

### 3. Evidence integrity

Are factual claims, statistics, quotations, and current assertions supported by
the research? Do citations point to real sources that support the nearby claim?
Does the prose distinguish evidence from inference and opinion?

Score 0 for an invented source, fabricated quotation, unsupported statistic, or
a citation that does not support its claim. This is a critical criterion.

### 4. Brand voice and trust

Does the article sound like the configured brand and follow its style guidance?
Is it direct, natural, and free from empty AI phrasing, excessive throat-clearing,
and repetitive conclusions? Are product claims and calls to action accurate?

Score 0 when it contradicts the brand, invents a product capability, or uses the
wrong company or domain. This is a critical criterion.

### 5. Structure and usefulness

Does every section advance the argument? Is the post easy to scan without becoming
a list of shallow fragments? Are examples, tables, steps, images, and callouts used
only where they make the explanation clearer? Can the reader act on the result?

Score 0 when the structure is incoherent, materially repetitive, or missing the
practical answer promised by the title.

### 6. Search and distribution readiness

Does the title accurately promise the content? Are the primary topic and related
entities covered naturally? Are metadata, internal links, source links, image alt
text, and the CTA useful and accurate? Would the article remain useful if read by
a person arriving from Google or an AI answer engine?

Score 0 when the title is misleading, metadata is unrelated, links are invented,
or optimization makes the prose unnatural.

## Required procedure

1. Finish the complete draft and all requested media.
2. Call `evaluateBlogPost` with the complete draft and an honest score for all six
   criteria.
3. If it fails, revise every failed item before evaluating again.
4. Call `saveBlogPost` only after the evaluation tool returns `passed: true`.
5. Never describe an unevaluated draft as complete.
