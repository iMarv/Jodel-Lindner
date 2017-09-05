export class Post {

    constructor(public userNumber: number, public text: string) {}

    get oj(): boolean {
        return this.userNumber == 0;
    }

    get firstMention(): number {
        const matches: RegExpMatchArray = this.text.trim().match(/@(\d+)/);
        return matches ? parseInt(matches[1]) : 0;
    }
}