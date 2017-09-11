# jodel-scraper

## Install

To install the tool, run either `yarn` or `npm install` depending on what you are using.

## How to use

To scrape the data of a jodel, navigate to its web-presentation (by using the share link), get into the source of the page and and copy all `li`-elements.
Place these into the `questions.txt` and run `yarn scrape`, which will output the parsed questions to `./docs/index.html`.

## Contribution

Feel free to contribute, Merge requests which do not pass TSLint won't be accepted.
