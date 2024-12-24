let flashMessagesMiddleware = (req, res, next) => {
    // Pass flash messages to the template
    res.locals.errorMessage = req.session.errorMessage || null;
    res.locals.successMessage = req.session.successMessage || null;
    res.locals.activeTab = req.session.activeTab || null;

    // Clear the session after using them
    delete req.session.errorMessage;
    delete req.session.successMessage;
    delete req.session.activeTab;

    next();
};

module.exports = flashMessagesMiddleware;
