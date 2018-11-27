const fs = require('fs');
const {web, auth, library, platform} = require('./src/request');
const {log, exportOauth2ClientId, delay} = require('./src/utils');

require('dotenv').config();
const {USERNAME, PASSWORD} = process.env;

/**
 * 로그인 페이지 및 기본쿠키 저장(oauth2 client id 포함)
 * @returns {Promise<String>} - Html
 */
const reqLoginPage = async () => {
    const res = await web({
        uri: '/account/login'
    });
    return res;
};

/**
 * 로그인 및 인증쿠키 저장
 * @returns {Promise<*>} - Html
 */
const reqLoginAuth = async () => {
    const res = await web.post({
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

/**
 * 로그인 및 인증쿠키 저장
 * @param {string} clientId - Html에 포함된 clientId
 * @returns {Promise<String>} Html
 */
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

/**
 * 선택된 책의 세부정보를 가져옴
 * @param {[Number]}ids - 책의 아이디 목록
 * @returns {Promise<[{
 *     id: Number,
 *     title: {
 *         main: String
 *     },
 *     thumbnail: {
 *         small: String,
 *         large: String,
 *         xxlarge: String
 *     },
 *     categories: [{
 *         id: Number,
 *         name: String,
 *         genre: String,
 *         sub_genre: String,
 *         is_series_category: Boolean
 *     }],
 *     series: {
 *         id: String,
 *         volume: Number,
 *         property: {
 *             last_volume_id: Number,
 *             title: String,
 *             unit: String,
 *             total_book_count: Number,
 *             is_serial: Boolean,
 *             is_completed: Boolean
 *         }
 *     },
 *     authors: {
 *         author: [{
 *             id: Number,
 *             name: String
 *         }] | undefined,
 *         original_author: [{
 *             id: Number,
 *             name: String
 *         }] | undefined,
 *         story_writer: [{
 *             id: Number,
 *             name: String
 *         }] | undefined,
 *         illustrator: [{
 *             id: Number,
 *             name: String
 *         }] | undefined,
 *         translator: [{
 *             id: Number,
 *             name: String
 *         }]
 *     },
 *     file: {
 *         size: Number,
 *         format: String,
 *         is_drm_free: Boolean,
 *         is_comic: Boolean,
 *         is_webtoon: Boolean,
 *         is_manga: Boolean,
 *         is_comic_hd: Boolean,
 *         page_count: Number
 *     },
 *     property: {
 *         is_novel: Boolean,
 *         is_magazine: Boolean,
 *         is_adult_only: Boolean,
 *         is_new_book: Boolean,
 *         is_open: Boolean,
 *         is_somedeal: Boolean,
 *         is_trial: Boolean,
 *         preview_rate: Number,
 *         is_wait_free: Boolean
 *     },
 *     support: {
 *         android: Boolean,
 *         ios: Boolean,
 *         mac: Boolean,
 *         paper: Boolean,
 *         window: Boolean,
 *         web_viewer: Boolean
 *     },
 *     publish: {
 *         ridibooks_register: Date,
 *         ebook_publish: Date,
 *         ridibooks_publish: Date
 *     },
 *     publisher: {
 *         id: Number,
 *         name: String,
 *         cp_name: String
 *     },
 *     last_modified: Date
 * }]>}
 */
const reqBookList = async (ids) => {
    const res = await platform({
        uri: '/books',
        qs: {
            b_ids: ids.join(',')
        },
    });
    return res;
};

/**
 * 책의 개수를 가져옴
 * @param {Number | null | undefined} unitId - 유닛 아이디
 * @returns {Promise<{
 *     unit_total_count: Number | undefined,
 *     item_total_count: Number
 * }>}
 */
const reqBookCount = async (unitId = null) => {
    const res = await library({
        uri: unitId ? `/items/${unitId}count` : '/items/count',
    });
    return res;
};

/**
 * 모든 책을 가져옴
 * @param {Number | null | undefined} unitId - 유닛 아이디
 * @param {Number} offset - 결과 시작점
 * @param {Number} limit - 결과 개수
 * @returns {Promise<{
 *     items: [{
 *         b_id: Number,
 *         service_type: String,
 *         is_ridiselect: boolean,
 *         purchase_date: Date,
 *         expire_date: Date,
 *         remain_time: Date,
 *         unit_title: String | undefined,
 *         unit_type: number | undefined,
 *         unit_id: Number | undefined,
 *         unit_count: number | undefined
 *     }],
 *     unit: {
 *         id: Number,
 *         title: String,
 *         type: Number
 *     } | undefined
 * }>}
 */
const reqBookMetaList = async (unitId = null, offset = 0, limit = 20) => {
    const res = await library({
        uri: unitId ? `/items/${unitId}` : '/items',
        qs: {
            order_type: unitId ? 'unit_order' : 'purchase_date',
            order_by: unitId ? 'asc' : 'desc',
            offset,
            limit
        },
    });
    return res;
};

(async () => {
    const data = [];
    try {
        await fs.writeFileSync('data.json', JSON.stringify(data, null, 4), 'utf8');
        const resLoginPage = await reqLoginPage();
        const resLoginAuth = await reqLoginAuth();
        log(resLoginAuth);
        await reqLoginOauth2(exportOauth2ClientId(resLoginPage));
        const totalCount = await reqBookCount();
        log(`구매한 책의 총 개수 : ${totalCount.item_total_count} / 구매한 시리즈의 총 개수 : ${totalCount.unit_total_count}`);
        const allBookMetaList = await reqBookMetaList(null, 0, totalCount.unit_total_count);
        log(`총 ${allBookMetaList.items.length}권의 시리즈를 가져왔습니다.`);
        for (let meta of allBookMetaList.items) {
            log(`[${meta.unit_id}] ${meta.unit_title}(${meta.unit_count})`);
            const unitBookMetaList = await reqBookMetaList(meta.unit_id, 0, meta.unit_count);
            const unitBookList = await reqBookList(unitBookMetaList.items.map((item) => item.b_id));
            log(`⌜   --- 해당 시리즈중 총 ${unitBookList.length}개의 책을 가져왔습니다. --`);
            for (let book of unitBookList) {
                log(`⎮   ${book.title.main}`)
            }
            data.push({
                unit: meta,
                bookMetaList: unitBookMetaList,
                bookList: unitBookList
            });
            log(`⌞   ------------------------------------------------------`)
            await delay(5000);
        }
        await fs.writeFileSync('src/data.json', JSON.stringify(data, null, 4), 'utf8');
        log('종료되었습니다.');
    } catch (e) {
        log(e);
    }
})();
