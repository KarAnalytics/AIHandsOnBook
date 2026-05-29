
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

  // Page background with the cover logo for the title page only. Reset
  // before the TOC and main content.
  set page(
    numbering: none,
    paper-size,
    background: if cover != none {
      place(center + horizon, image(cover, width: 80%))
    },
  )

  // Chapter counter: independent from built-in heading counter so that
  // unnumbered chapters (How to Use, Appendix) don't advance "Chapter N".
  let chapter_counter = counter("chapter_counter")
  let unnumbered_titles = ("AI for Business", "How to Use This Book", "Appendix")

  // Disable built-in numbering for level 1 (we draw "Chapter N:" ourselves).
  // For level 2+, prefix with the manual chapter counter so sub-sections
  // read as "1.1", "1.2" etc. matching the printed "Chapter 1".
  set heading(numbering: (..args) => {
    let nums = args.pos()
    let level = nums.len()
    if level == 1 { none }
    else {
      context {
        let ch = chapter_counter.get().at(0)
        let sub = nums.slice(1).map(str).join(".")
        [#ch.#sub]
      }
    }
  })

  // Figure and equation numbering use the manual chapter counter.
  set figure(numbering: (..args) => context {
    let ch = chapter_counter.get().at(0)
    let fig = counter(figure).get().at(0)
    [#ch.#fig]
  })

  set math.equation(numbering: (..args) => context {
    let ch = chapter_counter.get().at(0)
    [(#ch.#numbering("1)", ..args.pos()))]
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

// COVERPAGE — title at top, faded logo background (via set page), author at bottom.
  v(12%)
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
      #text(13pt, fill: gray.darken(40%))[A book by]
      #linebreak()
      #v(0.4em)
      // Override link color for author so it picks up theme red instead of blue.
      #show link: set text(fill: theme, weight: "bold")
      #link("https://business.ku.edu/people/karthik-srinivasan")[
        #text(22pt, authors)
      ]
      #linebreak()
      #v(0.3em)
      #text(11pt, fill: gray.darken(30%))[University of Kansas School of Business]
    ])
    v(2cm)
  }


// PREFACE
  if preface != none {
    pagebreak()
    set page(background: none)
    place(top + left,
      text(14pt, fill: theme, "Preface")
    )
    v(1em)
    set par(justify: true)
    align(center, box(width: 70%, text(11pt, overhang: true, font: "New Computer Modern", fill: gray.darken(30%), preface)))
  }


// OUTLINE OF THE BOOK — reset background before ToC.
  pagebreak()
  set page(background: none)
  if show_ToC == true {

    // Customize level-1 entries so they read like the printed headings:
    // "Chapter N: Title  ...........  page" for numbered chapters,
    // just the title for unnumbered ones.
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
        let ch_num = chapter_counter.at(it.element.location()).at(0)
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
// just the centered title for unnumbered ones. Pagebreak before each.
  show heading.where(level: 1): it => {
    pagebreak()
    counter(figure).update(0)
    counter(figure.where(kind: table)).update(0)
    counter(math.equation).update(0)

    let body_text = repr(it.body)
    let is_unnumbered = unnumbered_titles.any(t => body_text.contains(t))

    if is_unnumbered {
      v(2em)
      align(center, text(weight: "bold", size: 26pt, fill: colorheadings, it.body))
      v(1.5em)
    } else {
      chapter_counter.step()
      v(2em)
      align(center, context [
        #text(size: 16pt, fill: theme)[Chapter #chapter_counter.get().at(0)]
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
