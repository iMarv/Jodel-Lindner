import { Post } from './post';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

fs.readFile(path.join(__dirname, '../questions.txt'), scrapeDocument);

interface QuestionAnswerPair {
    questions: Post[],
    answer: Post
}

function scrapeDocument(err: NodeJS.ErrnoException, data: Buffer): void {
    if(err) {
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

        for (let index = 1; index < posts.length; index++) {
            // Only check for OJs answers
            if (!posts[index].oj) {
                continue;
            }

            pairs.push({
                questions: findMentions(posts, posts[index].firstMention, index-1),
                answer: posts[index],
            })
        }
    }
}

function findMentions(posts: Post[], mentionNumber: number, startingIndex: number): Post[] {
    const possibleQuestions: Post[] = [];

    for (let index = startingIndex; index > 1; index--) {
        // If a possible answer was already found, break on next OJ answer
        if(posts[index].oj && possibleQuestions.length > 0)
            break;
        
        if(posts[index].userNumber == mentionNumber) {
            possibleQuestions.push(posts[index]);
        }
    }

    return possibleQuestions;
}

function toHtml(pairs: QuestionAnswerPair[]): string {
    return pairs.map(pair => {
        return `
        <div class="question-wrapper">
            ${ pair.questions.map(question => `<div class="question">${question}</div>`).join('\n') }
            <div class="answer">${ pair.answer }</div>
        </div>`;
    }).join('\n')
}