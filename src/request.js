const _request = require('request-promise');

const jar = _request.jar();
const web = _request.defaults({
    method: 'GET',
    baseUrl: 'https://ridibooks.com',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Host': 'ridibooks.com'
    },
    jar
});

const auth = _request.defaults({
    baseUrl: 'https://account.ridibooks.com',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Host': 'account.ridibooks.com',
        'Referer': 'https://ridibooks.com/account/login'
    },
    json: true,
    jar,
});

const library = _request.defaults({
    baseUrl: 'https://library-api.ridibooks.com',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://ridibooks.com',
        'Referer': 'https://ridibooks.com/library',
        'Host': 'library-api.ridibooks.com',
    },
    json: true,
    jar,
});

const platform = _request.defaults({
    baseUrl: 'https://platform-api.ridibooks.com',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://ridibooks.com',
        'Host': 'platform-api.ridibooks.com',
        'Referer': 'https://ridibooks.com/library'
    },
    json: true,
    jar,
});

module.exports = {web, auth, library, platform};
