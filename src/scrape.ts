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
        <title>Lindner-Jodel AMA ~ Zusammenfassung</title>
    </head>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/css/bootstrap.min.css" integrity="sha384-/Y6pD6FV/Vv2HJnA6t+vslU6fwYXjCFtcEpHbNJ0lyAFsXTsjBbfaDjzALeQsN6M" crossorigin="anonymous">
    <body>
    <a href="https://github.com/iMarv/Jodel-Lindner"><img style="position: absolute; top: 0; right: 0; border: 0;" src="https://camo.githubusercontent.com/652c5b9acfaddf3a9c326fa6bde407b87f7be0f4/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f6f72616e67655f6666373630302e706e67" alt="Fork me on GitHub" data-canonical-src="https://s3.amazonaws.com/github/ribbons/forkme_right_orange_ff7600.png"></a>
        <div class="jumbotron">
            <h1 class="display-3">Christian Lindner - Jodel AMA</h1>
            <hr class="my-4">
            <p>Hi! Ich bin Marvin und habe versucht das Jodel-AMA von Christian Lindner im Nachhinein zu lesen - relativ erfolglos weil es ein riesiges Durcheinander ist.
            Daher habe ich ein Tool entwickelt, welches versucht weitestgehend die passenden Fragen zu Christian Lindners Antworten zu suchen.
            Wenn mehrere Jodel des selben Nutzers in Frage kommen, so seht ihr unten alle aufgelistet und müsst entsprechend euren gesunden Menschenverstand nutzen um herauszufinden welche denn die passende Frage ist.</p>
            <div class="card text-white bg-danger mb-6">
                <div class="card-body">
                    Das Design der Seite ist noch nicht fertig und meiner Müdigkeit geschuldet, der Programmcode der die Antworten sucht wird auch verbesserst sobald ich am Mittwoch von der Arbeit komme.<br />
                    Ihr könnt also entweder auf meinen Feierabend morgen warten, oder wenn ihr technisch was drauf habt, das Repository dieser Seite auf GitHub forken und das Design anpassen,<br /> ich werde versuchen in meiner Mittagspause eventuelle Pull-Requests zu bearbeiten.
                </div>
            </div>
        </div>
        <div class="container">
            ${ toHtml(pairs.slice(0, pairs.length - 1)) /* Hotfix because I am tired and magically CLs last answer is intepreted as a question */}
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
            <div class="card-header">Frage von @${ question.userNumber }</div>
            <div class="card-body">
                <p class="card-text">${ question.text }</p>
            </div>
        </div>`).join('<hr />\n') }
    </div>
    <div class="col-md-6">
        <div class="card bg-secondary">
            <div class="card-header">Antwort von Christian Lindner</div>
            <div class="card-body">
                <p class="card-text">${ pair.answer.text }</p>
            </div>
        </div>
    </div>
</div>`;
    }).join('<hr />\n');
}