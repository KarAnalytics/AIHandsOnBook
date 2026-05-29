
#let leftCaption(it) = {
  set text(size: 8pt)
  set align(left)
  set par(justify: true)

  context(it, {
    text(weight: "bold")[#it.supplement #it.counter.display(it.numbering).]
  })

  h(4pt)
  set text(fill: black.lighten(20%), style: "italic")
  it.body
}


#let template(
  // FRONTPAGE.
  title: "Book Title",
  subtitle: none,
  authors: "Your name",
  cover: none,
  cover_width: 12cm,
  coverposition: 1cm,
  justification: false,

  // TOC
  ToC_depth: 2,
  show_ToC: true,

  // PREFACE
  preface: none,

  // SPECIFICATION of output
  paper-size: "a4",
  margin: (),
  linespacing: .5em,
  show_pagenumber: false,
  margin_top: 2cm,
  margin_bottom: 2cm,
  margin_left: 20%,
  margin_right: 10%,
  logo: none,
  logo_width: 10%,

  font: "Libertinus Serif",
  fontsize: 11pt,

  theme: red.darken(30%),
  colorheadings: black,

  body
) = {

  // Cover-page-only styling: light-grey fill + faded cover logo as a backdrop.
  // Reset before the TOC and main content.
  set page(
    numbering: none,
    paper-size,
    fill: rgb("#f1f1f1"),
    background: if cover != none {
      place(center + horizon, image(cover, width: 80%))
    },
  )

  // Unnumbered chapters: front-matter and back-matter sections that should
  // not get a "Chapter N" label. Matched by substring against the heading body.
  // intro.md's H1 starts with "AI for Business", so it's covered too.
  let unnumbered_titles = ("AI for Business", "How to Use This Book", "Appendix")
  // For front-matter unnumbered chapters we roll back the built-in heading
  // counter so AI at a Glance becomes Chapter 1. For Appendix we don't roll
  // back, so its sub-sections (20.1 etc.) stay unique rather than colliding
  // with Chapter 19's sub-sections.
  let rollback_titles = ("AI for Business", "How to Use This Book")

  // Disable the built-in number on level-1 headings (we draw "Chapter N:"
  // ourselves in the show rule). Sub-sections keep the default X.Y / X.Y.Z
  // numbering from the built-in heading counter, which the rollback above
  // keeps in sync with the displayed chapter number.
  set heading(numbering: (..args) => {
    let nums = args.pos()
    let level = nums.len()
    if level == 1 { none }
    else { numbering("1.1", ..nums) }
  })

  // Figure and equation numbering use the built-in heading counter for the
  // chapter prefix (matching what the chapter heading displays after rollback).
  set figure(numbering: (..args) => {
    let chapter = counter(heading).display((..nums) => str(nums.pos().at(0)))
    let fig = counter(figure).display("1")
    [#chapter.#fig]
  })

  set math.equation(numbering: (..args) => {
    let chapter = counter(heading).display((..nums) => str(nums.pos().at(0)))
    [(#chapter.#numbering("1)", ..args.pos()))]
  })
  show math.equation: set block(spacing: 1em)


  set enum(indent: 10pt, body-indent: 9pt)
  set list(indent: 10pt, body-indent: 9pt)

  show link: set text(fill: blue.darken(30%))

  // Code blocks: light-grey fill, monospace, left rule, slight indent.
  show raw.where(block: true): it => {
    set text(font: ("DejaVu Sans Mono", "Liberation Mono", "Consolas", "Menlo"), size: 9pt)
    block(
      width: 100%,
      fill: rgb("#f5f5f5"),
      stroke: (left: 2pt + rgb("#cccccc")),
      radius: 3pt,
      inset: (x: 10pt, y: 8pt),
      above: 0.8em,
      below: 0.8em,
      it,
    )
  }
  show raw.where(block: false): it => {
    box(
      fill: rgb("#f0f0f0"),
      radius: 2pt,
      inset: (x: 3pt, y: 0pt),
      outset: (y: 3pt),
      text(font: ("DejaVu Sans Mono", "Liberation Mono", "Consolas", "Menlo"), size: 0.92em, it),
    )
  }

// COVERPAGE — "First Edition" in the top-right corner, title centered up top,
// faded logo as page backdrop (set via the page above), author name centered
// at the bottom with the KU profile link.
  place(top + right, dx: -0.5cm, dy: 0.5cm,
    text(11pt, weight: "bold", tracking: 1pt, fill: theme, "FIRST EDITION")
  )

  v(15%)
  align(center, text(34pt, weight: "bold", fill: theme, title))
  if subtitle != none {
    v(0.5em)
    align(center, text(16pt, fill: gray.darken(30%), subtitle))
  }
  v(0.6em)
  align(center, line(length: 30%, stroke: 1pt + theme))

  v(1fr)

  if authors != none {
    align(center, [
      #show link: set text(fill: theme, weight: "bold")
      #link("https://business.ku.edu/people/karthik-srinivasan")[
        #text(22pt, authors)
      ]
    ])
    v(2.5cm)
  }


// PREFACE
  if preface != none {
    pagebreak()
    set page(background: none, fill: white)
    place(top + left,
      text(14pt, fill: theme, "Preface")
    )
    v(1em)
    set par(justify: true)
    align(center, box(width: 70%, text(11pt, overhang: true, font: "New Computer Modern", fill: gray.darken(30%), preface)))
  }


// OUTLINE OF THE BOOK — reset background and fill before TOC.
  pagebreak()
  set page(background: none, fill: white)
  if show_ToC == true {

    // Custom level-1 outline entries: "Chapter N: Title  ..  page" for numbered
    // chapters, just the title for unnumbered ones. Sub-section entries use
    // the default outline rendering, which picks up the X.Y numbering from
    // set heading(numbering: ...) above.
    show outline.entry.where(level: 1): it => context {
      let body_text = repr(it.element.body)
      let is_unnumbered = unnumbered_titles.any(t => body_text.contains(t))

      v(12pt, weak: true)
      if is_unnumbered {
        link(it.element.location())[
          #strong[#it.element.body]
          #box(width: 1fr, repeat[.])
          #it.page()
        ]
      } else {
        let ch_num = counter(heading).at(it.element.location()).at(0)
        link(it.element.location())[
          #strong[Chapter #ch_num: #it.element.body]
          #box(width: 1fr, repeat[.])
          #it.page()
        ]
      }
    }
    outline(
      title: strong(text(fill: theme, "Contents")),
      depth: ToC_depth,
      indent: auto,
    )

  }

// CHAPTER HEADINGS — centered "Chapter N: Title" for numbered chapters,
// just the centered title for unnumbered ones. Roll back the built-in heading
// counter after front-matter unnumbered chapters so the next chapter starts
// at the correct number.
  show heading.where(level: 1): it => {
    pagebreak()
    counter(figure).update(0)
    counter(figure.where(kind: table)).update(0)
    counter(math.equation).update(0)

    let body_text = repr(it.body)
    let is_unnumbered = unnumbered_titles.any(t => body_text.contains(t))
    let do_rollback = rollback_titles.any(t => body_text.contains(t))

    if is_unnumbered {
      v(2em)
      align(center, text(weight: "bold", size: 26pt, fill: colorheadings, it.body))
      v(1.5em)
      if do_rollback {
        counter(heading).update(c => calc.max(0, c - 1))
      }
    } else {
      v(2em)
      align(center, context [
        #text(size: 16pt, fill: theme)[Chapter #counter(heading).get().at(0)]
        #linebreak()
        #v(0.4em)
        #text(weight: "bold", size: 26pt, fill: colorheadings, it.body)
      ])
      v(1.5em)
    }
  }

  show heading: set text(colorheadings)


// PAGE LAYOUT OF CONTENT
  set page(
    numbering: if show_pagenumber == true {"1"} else {none},
    margin: (
      top: margin_top,
      bottom: margin_bottom,
      left: margin_left,
      right: margin_right
    ),
    header: if logo != none { align(center)[#image(logo, width: logo_width)] } else { none },
    background: none,
    fill: white,
  )

  set text(
    font: font,
    size: fontsize
  )
  set par(
    leading: linespacing,
    justify: justification
  )

  counter(page).update(1)

  [#body]
}
