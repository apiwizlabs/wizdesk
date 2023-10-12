import { getEnv } from "./utils"

export default {
    PUBLIC_KEY : getEnv("PUBLIC_KEY"),
    API_BASE_URL:getEnv("API_BASE_URL"),
    BASE_URL: getEnv("BASE_URL"),
    GOOGLE_OAUTH_CLIENT_ID: getEnv("GOOGLE_OAUTH_CLIENT_ID"),
}