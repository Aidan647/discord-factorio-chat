import fs from "fs/promises"
import { configFile, defaultConfig } from "./types"
import { logger } from "./index"

export const fileExists = async (path: string) => {
	return fs.stat(path).then(
		() => true,
		() => false
	)
}

const stripJSONComments = (data: string) => {
	var re = new RegExp("//(.*)", "g")
	return data.replace(re, "")
}

export const config: configFile = {} as configFile

// merge default config with config file
// deep merge
// write old config to config_old.json
// overwrite config.json with new config if any new values are added
// config_old.json overwrite is allowed
// config.json can be missing
// config.json can be empty
// use fs as fs/promises

// deep merge old with new
// return changed keys
// return oldO if no changes

type OBJ = { [key: string]: any }
function merge(oldO: OBJ, newO: OBJ, path = [] as string[]): { result: OBJ; added: string[] } {
	const added: string[] = []
	const result: OBJ = {} as OBJ
	Object.entries(newO).forEach(([key, value]) => {
		const oldV = oldO[key]
		if (oldV === undefined) {
			result[key] = value
			added.push(path.concat(key).join("."))
		} else if (Array.isArray(value)) {
			if (Array.isArray(oldV)) {
				result[key] = oldV
			} else if (typeof oldV === "string") {
				result[key] = [oldV]
			} else {
				result[key] = [String(oldV)]
				// warn user that old value was overwritten
				logger.warn(`Overwrote ${path.join(".")}.${key} with ${JSON.stringify([String(oldV)])}`)
			}
		} else if (typeof value === "object" && value !== null) {
			const { result: subResult, added: subAdded } = merge(oldV, value, path.concat(key))
			if (subResult !== oldV) {
				result[key] = subResult
				added.push(...subAdded)
			}
		} else if (oldV !== undefined) {
			result[key] = oldV
		}
	})
	return { result, added }
}
// function to deeply get all keys of an object
// returns an array of keys
function getKeys(obj: OBJ, path = [] as string[]) {
	const keys: string[] = []
	Object.entries(obj).forEach(([key, value]) => {
		if (Array.isArray(value)) {
			keys.push("Array:" + path.concat(key).join("."))
		} else if (typeof value === "object" && value !== null) {
			keys.push(...getKeys(value, path.concat(key)))
		} else {
			keys.push(path.concat(key).join("."))
		}
	})
	return keys
}

// function to deeply verify config file
// check if all required keys are present
// required keys are keys of defaultConfig
// use getKeys to get all keys
function verify(obj: OBJ) {
	const keys = [getKeys(defaultConfig), getKeys(obj)]
	// check if all required keys are present
	//console log all missing keys
	return keys[0].every((key) => keys[1].includes(key))
}

async function loadConfig() {
	// check if config file exists
	if (await fileExists("config.json")) {
		const configData = JSON.parse(stripJSONComments(await fs.readFile("config.json", "utf8"))) as configFile
		if (verify(configData)) {
			//TODO fix this shit
			type configKeys = keyof configFile
			const keys: configKeys[] = Object.keys(configData) as configKeys[]
			keys.forEach((key) => {
				// @ts-ignore
				config[key] = configData[key]
			})
			return
		} else {
			// copy config to config_old.json
			await fs.copyFile("config.json", "config_old.json").catch(() => {
				logger.error("Could not copy config.json to config_old.json")
				process.exit(1)
			})
			// merge config with default config
			// write new config to config.json
			const { result, added } = merge(configData, defaultConfig)
			await fs.writeFile("config.json", JSON.stringify(result, null, "\t"))
			if (added.length == 0) {
				//TODO fix this shit
				type configKeys = keyof configFile
				const keys: configKeys[] = Object.keys(result) as configKeys[]
				keys.forEach((key) => {
					// @ts-ignore
					config[key] = (result as configFile)[key]
				})
				return
			}
			logger.info(`Added ${added.join(", ")} to config.json`)
			logger.info("Please edit config.json and restart the bot")
			process.exit(0)
		}
	} else {
		// create config file with default config
		await fs.writeFile("config.json", JSON.stringify(defaultConfig, null, "\t"))
		// indicate that config file was created and needs to be edited
		logger.info("Created config file. Please edit config.json and restart the bot.")
		// exit
		process.exit(0)
	}
}
export const awaitConfig = loadConfig()
