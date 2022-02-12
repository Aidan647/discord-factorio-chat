export function format(text: string, settings: { [key: string]: string } = {}): string {
	for (const key in settings) {
		text = text.replaceAll(`{${key}}`, settings[key].replaceAll("{", "\uE000").replaceAll("}", "\uE001"))
	}
	return text.replaceAll("\uE000", "{").replaceAll("\uE001", "}")
}
