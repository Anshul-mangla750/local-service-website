class ExpressError extends Error {
    constructor(message, status) {
        super(); // sets this.message automatically
        this.status = status;
        this.message=message;
    }
}

module.exports.ExpressError = ExpressError;









