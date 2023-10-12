module.exports = {
  DB_URL: "<mongo_db_url>",
    NODE_ENV: "development",
    PORT: 3002,
    AWS_BUCKET_NAME: "<aws bucket name>",
    AWS_REGION: "<aws region>", //same region for public and private buckets
    TOKEN_EXPIRY: '52h',
    INVITE_EXPIRY: "2h",  // invite link expiry
    RESET_EXPIRY: "300000",
    MAIL_HOST:"smtp.gmail.com",
    MAIL_PORT:"<mail host port>",
    MAIL_USER:"<mail id>",
    MAIL_PASSWORD:"<mail password>",
    MAIL_FROM:"<mail id>",
    BASE_URL: "http://localhost:3000/"
  }