/*
 * Config file
 */
var config = {
    ROOT_DOCUMENT : './static', /* folder of static documents (html/js/css etc..) */
    BIKE_FOLDER  : 'bike/', /* folder of bike's images */
    DB_CONNECTION_STR : '', /* MongoDB connection string. */
    sporping_item_col : undefined,
    sporping_item_last_col : undefined,
    MAX_DISTANCE : 25000, //25km
    MIN_DISTANCE : 2000, //2km;
    HTTP_AUTH_USR : undefined,
    HTTP_AUTH_PWD : undefined,
    HTTP_PORT  : 8080,
    HOSTNAME : undefined,
    GMAIL_USR : undefined,
    GMAIL_PWD : undefined,
    PRODUCTION : true,
    PER_PAGE : 5, /* PER PAGE ITEMS */
    BIKE_ACTIVATOR_LOCATION: undefined 
};
exports.config = config;