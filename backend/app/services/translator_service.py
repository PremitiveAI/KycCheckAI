# services/translator_service.py

from langdetect import detect
from googletrans import Translator

translator = Translator()


def detect_language(text: str):
    try:
        return detect(text)
    except:
        return "en"


def translate_to_english(text: str):
    try:
        lang = detect_language(text)
        if lang == "en":
            return text
        result = translator.translate(text, src=lang, dest="en")
        return result.text
    except:
        return text


def translate_to_language(text: str, target_lang: str):
    try:
        if target_lang == "en":
            return text
        result = translator.translate(text, src="en", dest=target_lang)
        return result.text
    except:
        return text


async def translate_values_only(data, target_lang):
    """
    Recursively translate ONLY string values inside a JSON-like structure.
    Works with dict, list, and str.
    """
    if isinstance(data, dict):
        return {
            key: await translate_values_only(value, target_lang)
            for key, value in data.items()
        }

    elif isinstance(data, list):
        return [await translate_values_only(v, target_lang) for v in data]

    elif isinstance(data, str):
        # Use your existing translator
        return translate_to_language(data, target_lang)

    else:
        return data




