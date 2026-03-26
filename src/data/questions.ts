export type ScoreValue = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  text: string;
  options: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
  recommendation: string;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export const categories: Category[] = [
  {
    id: 'differentiation',
    title: 'Differentiation',
    description: 'Is this piece of thought leadership relevant to me right now? Does it tell me something useful that I didn\'t know already?',
    questions: [
      {
        id: 'diff_1',
        text: 'Is it obvious what it\'s about, and what the intended benefits are to the target audience?',
        options: {
          5: 'What it\'s about is clear from the start. Specific target audience is identified. Intended benefits to this audience are clear and substantial.',
          4: 'What it\'s about is clear from the start. Intended benefits to assumed audience are clear and substantial.',
          3: 'What it\'s about is clear from the start. Intended benefits to assumed audience are clear.',
          2: 'What it\'s about and intended benefits become clear over time OR What it\'s about is clear from the start but intended benefits are unclear OR Specific target audience is identified but what it\'s about is unclear.',
          1: 'What it\'s about is unclear.',
        },
        recommendation: 'Clearly state the topic and target audience in the introduction. Explicitly outline the benefits the reader will gain.',
      },
      {
        id: 'diff_2',
        text: 'Is it different to what others are doing—either because of the topic or the angle taken?',
        options: {
          5: 'Subject and approach different to what has gone before.',
          4: 'Subject different to what has gone before.',
          3: 'Subject has been written about before but angle is different.',
          2: 'Covers the same ground as some other consulting firms.',
          1: 'Has been written about extensively.',
        },
        recommendation: 'Find a unique angle or niche topic. Conduct a competitor review to ensure your perspective hasn\'t been overused.',
      },
      {
        id: 'diff_3',
        text: 'Is it revelatory?',
        options: {
          5: 'Presents a revelatory and challenging viewpoint.',
          4: 'Challenges current thinking in some areas.',
          3: 'Raises a number of interesting points.',
          2: 'Some interesting points but in the main states the obvious.',
          1: 'States the obvious.',
        },
        recommendation: 'Push your conclusions further. Don\'t just state facts; provide a bold, counter-intuitive, or challenging perspective.',
      },
    ],
  },
  {
    id: 'appeal',
    title: 'Appeal',
    description: 'Am I encouraged to read on? Is it easy and enjoyable to use?',
    questions: [
      {
        id: 'app_1',
        text: 'Is the user likely to continue beyond the first 20 seconds of their experience?',
        options: {
          5: 'User compelled to continue.',
          4: 'User likely to continue.',
          3: 'Experience provides some encouragement to continue.',
          2: 'Experience does nothing to encourage the user to continue.',
          1: 'Experience is off-putting.',
        },
        recommendation: 'Improve the hook. Use a compelling headline, an engaging opening story, or a striking visual to grab attention immediately.',
      },
      {
        id: 'app_2',
        text: 'Does it look good and maintain visual consistency throughout the report?',
        options: {
          5: 'Appealing format with flawless visual consistency across all pages/sections. Easy to use on tablet. Visual devices make key messages easy to grasp immediately.',
          4: 'Better than (3) but falls down on at least one of the requirements for (5).',
          3: 'Meets user expectations of a professionally produced piece of content with generally consistent formatting. Easy to use on laptop screen. Visual devices are clear.',
          2: 'Better than (1) but falls down on at least one of the requirements for (3), such as noticeable inconsistencies in design or layout.',
          1: 'Looks unprofessional, is highly inconsistent in its visual execution, or is difficult to use (e.g., illegible text or charts).',
        },
        recommendation: 'Invest in professional design and ensure strict visual consistency. Check that fonts, colors, chart styles, and spacing are uniform throughout the entire report.',
      },
      {
        id: 'app_3',
        text: 'Does the structure make it easy to use—whether start-to-finish or browsing?',
        options: {
          5: 'Structure is obvious from the outset and makes sense. It is easy to find key sections. Structure is used to lead audience through an engaging story.',
          4: 'Better than (3) but falls down on at least one of the requirements for (5).',
          3: 'Content divided into meaningful sections.',
          2: 'Has some structure.',
          1: 'Jumps from topic to topic with no obvious rationale from the audience\'s perspective.',
        },
        recommendation: 'Add a clear table of contents or executive summary. Use descriptive headings and ensure a logical flow from one section to the next.',
      },
      {
        id: 'app_4',
        text: 'Is the style clear, engaging, and consistent?',
        options: {
          5: 'Engaging, identifiable, and highly consistent voice throughout. Concise, easy-to-understand sentences and paragraphs. Stories used to inspire the reader.',
          4: 'Better than (3) but falls down on at least one of the requirements for (5).',
          3: 'Language clear, generally consistent, and appropriate to the target audience.',
          2: 'In places, language is unclear, tone is inconsistent (e.g., shifting abruptly between academic and conversational), or inappropriate.',
          1: 'Throughout, language is unclear, highly fragmented in tone, or inappropriate.',
        },
        recommendation: 'Edit for clarity, conciseness, and tonal consistency. Ensure the voice remains uniform from the introduction to the conclusion, removing jarring shifts in style.',
      },
      {
        id: 'app_5',
        text: 'Is the length appropriate to the insights delivered?',
        options: {
          5: 'Excellent ROI for the target audience—all of the content adds value.',
          4: 'Between (3) and (5).',
          3: 'Acceptable ROI for the target audience—could have been shorter but not noticeable to most users.',
          2: 'Between (1) and (3).',
          1: 'Requires far too much time from the target audience compared to the value of insights delivered.',
        },
        recommendation: 'Trim the fat. Ensure every paragraph adds value. If the piece is long, ensure the depth of insight justifies the time investment.',
      },
    ],
  },
  {
    id: 'resilience',
    title: 'Resilience',
    description: 'Can I trust what I am being told? Do I know who is writing this and why I should believe them?',
    questions: [
      {
        id: 'res_1',
        text: 'Is it clear who is delivering these views and why they are worth paying attention to?',
        options: {
          5: 'It is clear who is delivering these views and why their experience makes them a very credible expert on this topic.',
          4: 'It is clear who is delivering these views and that their experience relates to the topic of the report.',
          3: 'Authors or experts named and basic information is obvious (e.g., role).',
          2: 'Authors or experts named but no further information provided, or information not immediately obvious.',
          1: 'No information provided about the individuals behind the content.',
        },
        recommendation: 'Prominently feature author bios. Highlight their specific expertise, past experience, and why they are qualified to speak on this topic.',
      },
      {
        id: 'res_2',
        text: 'Is the approach to generating insights/recommendations credible and clearly explained?',
        options: {
          5: 'Audience very likely to understand what underpins key insights throughout the report. Approach is very credible. All sources are clearly referenced.',
          4: 'Better than (3) but falls down on at least one of the requirements for (5).',
          3: 'Audience very likely to understand principal approach used. Approach is credible. Most sources are referenced.',
          2: 'Audience very likely to have a sense of the principal approach employed but it is not explicitly described OR Approach is described but obviously flawed OR Approach described and credible but many sources not clearly referenced.',
          1: 'No sense of approach behind insights/recommendations OR Audience would guess it is based purely on the author\'s point of view.',
        },
        recommendation: 'Clearly explain your methodology. Cite your sources rigorously and explain how you arrived at your conclusions to build trust.',
      },
      {
        id: 'res_3',
        text: 'Has the firm collected or created relevant data?',
        options: {
          5: 'Firm has collected or created an impressive and relevant body of primary and secondary data.',
          4: 'Firm has collected or created an impressive and relevant body of data. One type of data only.',
          3: 'Firm has collected or created a solid and relevant body of data.',
          2: 'Firm has collected or created some data.',
          1: 'No collection or creation of data.',
        },
        recommendation: 'Incorporate proprietary data. Conduct surveys, interviews, or analyze internal data to provide unique evidence that supports your claims.',
      },
      {
        id: 'res_4',
        text: 'How good is the analysis of this data?',
        options: {
          5: 'Approach goes well beyond the obvious to deliver relevant insights.',
          4: 'Approach goes beyond the obvious to deliver relevant insights.',
          3: 'Basic approach that leads to relevant insights (e.g., simple segmentation).',
          2: 'Very basic approach, e.g., simple presentation of responses to individual questions OR Audience likely to assume some analysis has taken place but it is not visible.',
          1: 'No analysis of data.',
        },
        recommendation: 'Deepen your data analysis. Don\'t just report the numbers; explain the "why" behind them and look for non-obvious correlations or trends.',
      },
    ],
  },
  {
    id: 'prompting_action',
    title: 'Prompting Action',
    description: 'Do I have a clear sense of what I ought to do now? Will a conversation with this firm be useful to me?',
    questions: [
      {
        id: 'act_1',
        text: 'Is the audience given justified and actionable recommendations to apply within their own organisation?',
        options: {
          5: 'Offers specific actionable recommendations that are a logical outcome of the content and are drawn together to describe a coherent approach.',
          4: 'Offers specific actionable recommendations that are a logical outcome of the content.',
          3: 'Offers specific actionable recommendations.',
          2: 'Offers recommendations but they are generic and/or too high-level to be actionable.',
          1: 'No sense as to how the audience ought to apply the content to their own situation.',
        },
        recommendation: 'Provide clear, step-by-step recommendations. Ensure they are specific enough that a reader knows exactly what to do next.',
      },
      {
        id: 'act_2',
        text: 'Does it give the reader a clear idea of how the consulting firm could help whilst avoiding being a thinly disguised sales pitch?',
        options: {
          5: 'Provides information, relevant to this specific topic, about what the firm does, what experience it has, and what is unique about its approach.',
          4: 'Provides information, relevant to this specific topic, about what the firm does and what experience it has.',
          3: 'Provides information, relevant to this specific topic, about what the firm does.',
          2: 'Contains information about a relevant practice area.',
          1: 'No obvious link to the firm\'s services OR a standard boilerplate description.',
        },
        recommendation: 'Subtly weave in your firm\'s capabilities. Use case studies or examples of past work to demonstrate how you can help implement the recommendations, without being overly promotional.',
      },
      {
        id: 'act_3',
        text: 'Is the target audience likely to conclude that this is a topic they need to take action on?',
        options: {
          5: 'Delivers a compelling argument that this issue must be addressed immediately.',
          4: 'Delivers a compelling argument that this issue must be addressed.',
          3: 'Persuades the audience to consider this issue with colleagues to decide if action is required.',
          2: 'Makes the audience aware that this issue might be worth considering further.',
          1: 'Fails to make the case for further consideration.',
        },
        recommendation: 'Emphasize the urgency and impact. Clearly articulate the risks of inaction and the benefits of acting now to create a sense of urgency.',
      },
    ],
  },
];
