const _request = require('request-promise');

require('dotenv').config();
const {USERNAME, PASSWORD} = process.env;
// 쿠키저장소
const MATCH_OAUTH2_CLIENT_ID = /oauth2_client_id: '([0-9A-z]+)'/g;
const jar = _request.jar();
const request = _request.defaults({
    method: 'GET',
    baseUrl: 'https://ridibooks.com',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Host': 'ridibooks.com'
    },
    jar
});

let auth = _request.defaults({
    baseUrl: 'https://account.ridibooks.com',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Host': 'account.ridibooks.com',
        'Origin': 'https://ridibooks.com',
        'Referer': 'https://ridibooks.com'
    },
    json: true,
    jar,
});

let api = _request.defaults({
    baseUrl: 'https://library-api.ridibooks.com',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Host': 'library-api.ridibooks.com',
        'Origin': 'https://ridibooks.com',
        'Referer': 'https://ridibooks.com/library/'
    },
    json: true,
    jar,
});

const log = (message) => {
  console.log(message);
};

// html에 포함된 clientId를 가져옴
const getOauth2ClientId = (html) => {
    return MATCH_OAUTH2_CLIENT_ID.exec(html)[1];
};

// 로그인 페이지 및 기본쿠키 저장
const reqLoginPage = async () => {
    const res = await request.get({
        uri: '/account/login'
    });
    return res;
};

// 로그인 및 인증쿠키 저장
const reqLoginAuth = async () => {
    const res = await request.post({
        uri: '/account/action/login',
        formData: {
            user_id: USERNAME,
            password: PASSWORD,
            cmd: 'login',
            return_url: '/account/myridi',
            return_query_string: '',
            device_id: '',
            msg: '',
            auto_login: 1
        },
    });
    return res;
};

// 로그인 및 인증쿠키 저장
const reqLoginOauth2 = async (clientId) => {
    const res = await auth.get({
        uri: '/ridi/authorize',
        qs: {
            client_id: clientId,
            response_type: 'code',
            redirect_uri: 'https://account.ridibooks.com/ridi/complete'
        },
    });
    return res;
};

const apiPurchaseList = async (offset = 0) => {
    const res = await api({
        uri: '/items',
        qs: {
            order_type: 'purchase_date',
            order_by: 'desc',
            category: '',
            offset: offset,
            limit: 20
        },
    });
    return res;
};

(async () => {
    try {
        const resLoginPage = await reqLoginPage();
        const resLoginAuth = await reqLoginAuth();
        log(resLoginAuth);
        const oauth2ClientId = getOauth2ClientId(resLoginPage);
        const resLoginOauth2 = await reqLoginOauth2(oauth2ClientId);
        log(resLoginOauth2);
        const resPurchaseList = await apiPurchaseList();
        console.log(resPurchaseList);
    } catch (e) {
        // log(e);
    }
})();
