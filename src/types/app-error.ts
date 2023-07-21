export default class AppError extends Error {
    constructor(
        public name: string,
        public messageLines: string[] | string
    ) {
        const message = Array.isArray(messageLines)
            ? messageLines.join('\r\n')
            : messageLines;
        super(message);

        Object.setPrototypeOf(this, AppError.prototype);
    }
}
