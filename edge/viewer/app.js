const { USER_AGENT_BOT_LIST } = require('./constants');

exports.handler = (event, context, callback) => {
    const request = event.Records?.[0]?.cf?.request || {};
    const headers = request.headers || {};

    const ua = headers['user-agent']?.[0]?.value?.toLowerCase() || '';
    const isBot = Array.isArray(USER_AGENT_BOT_LIST)
    && USER_AGENT_BOT_LIST.some(x => ua.includes(String(x).toLowerCase()));

    headers['bot'] = [{ key: 'bot', value: String(isBot) }];
    request.headers = headers;

    // console.log(JSON.stringify(request))
    callback(null, request);
};
