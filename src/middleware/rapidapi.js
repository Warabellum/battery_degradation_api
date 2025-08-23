export function rapidAPIAuth(req, res, next) {
    // RapidAPI sends these headers
    const rapidAPIKey = req.headers['x-rapidapi-key'];
    const rapidAPIHost = req.headers['x-rapidapi-host'];
    const rapidAPIUser = req.headers['x-rapidapi-user'];

    if (!rapidAPIKey) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'API key required'
        });
    }

    // Store user info for analytics
    req.rapidAPI = {
        key: rapidAPIKey,
        host: rapidAPIHost,
        user: rapidAPIUser
    };

    next();
}