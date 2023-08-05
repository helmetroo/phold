export default class AppError extends Error {
    messageLines: string[];

    constructor(
        public name: string,
        messageOrLines: string[] | string
    ) {
        const isLines = Array.isArray(messageOrLines);

        // Base err message is a string
        const stringMessage = isLines
            ? messageOrLines.join('\r\n')
            : messageOrLines;
        super(stringMessage);

        this.messageLines = isLines
            ? messageOrLines
            : [messageOrLines];

        Object.setPrototypeOf(this, AppError.prototype);
    }
}
