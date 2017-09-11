import { Post } from './post';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

fs.readFile(path.join(__dirname, '../questions.txt'), scrapeDocument);

interface QuestionAnswerPair {
    questions: Post[];
    answer: Post;
}

function scrapeDocument(err: NodeJS.ErrnoException, data: Buffer): void {
    if (err) {
        console.log(err.message);
    } else {
        const $: CheerioStatic = cheerio.load(data.toString());
        const pairs: QuestionAnswerPair[] = [];

        // Map html list items to posts
        const posts: Post[] = $('li').toArray().map((element: CheerioElement): Post => {
            const user: string = $(element).find('.oj-text').text();
            const text: string = $(element).find('.post-message').text();

            return new Post(user === 'OJ' ? 0 : parseInt(user), text);
        });

        for (let index: number = 1; index < posts.length; index++) {
            // Only check for OJs answers
            if (!posts[index].oj) {
                continue;
            }

            pairs.push({
                questions: findMentions(posts, posts[index].firstMention, index - 1),
                answer: posts[index],
            });
        }

        const page: string = `
<!doctype html>
<html>
    <head>
        <title>Parsed Jodel-Content</title>
    </head>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/css/bootstrap.min.css" integrity="sha384-/Y6pD6FV/Vv2HJnA6t+vslU6fwYXjCFtcEpHbNJ0lyAFsXTsjBbfaDjzALeQsN6M" crossorigin="anonymous">
    <body>
        <div class="container">
            ${ toHtml(pairs.slice(0, pairs.length - 1)) /* Hotfix because I am tired and magically OJs last answer is intepreted as a question */}
        </div>
    </body>
</html>`;

        fs.writeFile(path.join(__dirname, '..', 'docs', 'index.html'), page);
    }
}

function findMentions(posts: Post[], mentionNumber: number, startingIndex: number): Post[] {
    const possibleQuestions: Post[] = [];

    for (let index: number = startingIndex; index > 1; index--) {
        // If a possible answer was already found, break on next OJ answer
        if (posts[index].oj && possibleQuestions.length > 0)
            break;

        if (posts[index].userNumber == mentionNumber) {
            possibleQuestions.push(posts[index]);
        }
    }

    return possibleQuestions;
}

function toHtml(pairs: QuestionAnswerPair[]): string {
    return pairs.map(pair => {
        return `
<div class="row">
    <div class="col-md-6">
        ${ pair.questions.map(question => `
        <div class="card">
            <div class="card-header">Question from @${ question.userNumber }</div>
            <div class="card-body">
                <p class="card-text">${ question.text }</p>
            </div>
        </div>`).join('<hr />\n') }
    </div>
    <div class="col-md-6">
        <div class="card bg-secondary">
            <div class="card-header">OJs Answer</div>
            <div class="card-body">
                <p class="card-text">${ pair.answer.text }</p>
            </div>
        </div>
    </div>
</div>`;
    }).join('<hr />\n');
}