var Promise = require('bluebird'),
    settingsCache = require('../../settings/cache'),
    utils = require('../../utils'),
    logging = require('../../logging'),
    getUrl = require('./url'),
    getImageDimensions = require('./image-dimensions'),
    getCanonicalUrl = require('./canonical_url'),
    getAmpUrl = require('./amp_url'),
    getPaginatedUrl = require('./paginated_url'),
    getAuthorUrl = require('./author_url'),
    getBlogLogo = require('./blog_logo'),
    getRssUrl = require('./rss_url'),
    getTitle = require('./title'),
    getDescription = require('./description'),
    getCoverImage = require('./cover_image'),
    getAuthorImage = require('./author_image'),
    getAuthorFacebook = require('./author_fb_url'),
    getCreatorTwitter = require('./creator_url'),
    getKeywords = require('./keywords'),
    getPublishedDate = require('./published_date'),
    getModifiedDate = require('./modified_date'),
    getOgType = require('./og_type'),
    getStructuredData = require('./structured_data'),
    getSchema = require('./schema'),
    getExcerpt = require('./excerpt');

function getMetaData(data, root) {
    var metaData = {
        url: getUrl(data, true),
        canonicalUrl: getCanonicalUrl(data),
        ampUrl: getAmpUrl(data),
        previousUrl: getPaginatedUrl('prev', data, true),
        nextUrl: getPaginatedUrl('next', data, true),
        authorUrl: getAuthorUrl(data, true),
        rssUrl: getRssUrl(data, true),
        metaTitle: getTitle(data, root),
        metaDescription: getDescription(data, root) || null,
        coverImage: {
            url: getCoverImage(data, true)
        },
        authorImage: {
            url: getAuthorImage(data, true)
        },
        authorFacebook: getAuthorFacebook(data),
        creatorTwitter: getCreatorTwitter(data),
        keywords: getKeywords(data),
        publishedDate: getPublishedDate(data),
        modifiedDate: getModifiedDate(data),
        ogType: getOgType(data),
        // @TODO: pass into each meta helper - wrap each helper
        blog: {
            title: settingsCache.get('title'),
            description: settingsCache.get('description'),
            url: utils.url.urlFor('home', true),
            facebook: settingsCache.get('facebook'),
            twitter: settingsCache.get('twitter'),
            timezone: settingsCache.get('active_timezone'),
            navigation: settingsCache.get('navigation'),
            icon: settingsCache.get('icon'),
            cover_image: settingsCache.get('cover_image'),
            logo: settingsCache.get('logo'),
            amp: settingsCache.get('amp')
        }
    };

    return Promise.props(getBlogLogo()).then(function (result) {
        metaData.blog.logo = result;

        // TODO: cleanup these if statements
        if (data.post) {
            // There's a specific order for description fields (not <meta name="description" /> !!) in structured data
            // and schema.org which is used the description fields (see https://github.com/TryGhost/Ghost/issues/8793):
            // 1. CASE: custom_excerpt is populated via the UI
            // 2. CASE: no custom_excerpt, but meta_description is poplated via the UI
            // 3. CASE: fall back to automated excerpt of 50 words if neither custom_excerpt nor meta_description is provided
            var customExcerpt = data.post.custom_excerpt,
                metaDescription = data.post.meta_description,
                fallbackExcerpt = data.post.html ? getExcerpt(data.post.html, {words: 50}) : '';

            metaData.excerpt = customExcerpt ? customExcerpt : metaDescription ? metaDescription : fallbackExcerpt;
        }

        if (data.post && data.post.author && data.post.author.name) {
            metaData.authorName = data.post.author.name;
        }

        return Promise.props(getImageDimensions(metaData)).then(function () {
            metaData.structuredData = getStructuredData(metaData);
            metaData.schema = getSchema(metaData, data);

            return metaData;
        });
    }).catch(function (err) {
        logging.error(err);
        return metaData;
    });
}

module.exports = getMetaData;