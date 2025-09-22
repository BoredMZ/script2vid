from gtts import gTTS
import sys

def main():
    text = sys.argv[1]
    output_path = sys.argv[2]
    lang = sys.argv[3] if len(sys.argv) > 3 else 'en'
    tts = gTTS(text=text, lang=lang)
    tts.save(output_path)

if __name__ == "__main__":
    main()
