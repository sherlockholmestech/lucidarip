import Lucida from "lucida";
import Qobuz from "lucida/streamers/qobuz";
import { loadConfig } from "c12";
import Tidal from "lucida/streamers/tidal";
import Deezer from "lucida/streamers/deezer";

const lucidaripConfigFile = loadConfig({
	configFile: "config.toml",
});

let lucidaripConfig = null;

await lucidaripConfigFile.then((config) => {
	lucidaripConfig = config.config;
	console.log("Config loaded");
}).catch((err) => {
	console.error(err);
	process.exit(1);
});

if (lucidaripConfig.version !== "1.0.0") {
	console.error("Incompatible config version");
	process.exit(1);
}

export const lucidaClient = new Lucida({
	modules: {
		quobuz: new Qobuz({
			appId: lucidaripConfig.qobuz.app_id,
			appSecret: lucidaripConfig.qobuz.app_secret,
			token: lucidaripConfig.qobuz.token
		}),
		tidal: new Tidal({
			tvToken: lucidaripConfig.tidal.tv_token,
			tvSecret: lucidaripConfig.tidal.tv_secret,
			accessToken: lucidaripConfig.tidal.access_token,
			refreshToken: lucidaripConfig.tidal.refresh_token,
			expires: lucidaripConfig.tidal.expires,
			countryCode: lucidaripConfig.tidal.country_code
		}),
		deezer: new Deezer({
			arl: lucidaripConfig.deezer.arl,
		})
	}
});

export default lucidaripConfig;