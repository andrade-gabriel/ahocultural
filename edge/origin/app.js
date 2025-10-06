exports.handler = async (event, context, callback) => {
    console.log('triggered')
    const cf = event.Records[0].cf;
    const request = cf.request;

    try{
        let prefix = '';
        if(typeof request.uri === 'string' && request.uri.indexOf('admin'))
            prefix = '/admin'

        // SEO Only
        if (request.headers?.["bot"]?.[0]?.value?.toLowerCase() === "true") {
            // remove "index.html" if it's at the end
            if (typeof request.uri === 'string') {
                request.uri = request.uri.replace(/index\.html$/i, '');
                if (!request.uri) request.uri = '/';
            } else {
                request.uri = '/';
            }

            // clean helper header
            delete request.headers["bot"];
        }
        // No file extension (SPA routing)
        else if (typeof request.uri === 'string' && request.uri.indexOf('.') === -1 || request.uri.endsWith('.html')) {
            // Client-side (default origin)
            request.uri = `${prefix}/index.html`;
        }
    }
    catch(e)
    {
        console.log('Exception', e)
    }

    callback(null, request);
};
