
from moviepy.editor import VideoFileClip, AudioFileClip, TextClip, CompositeVideoClip, concatenate_videoclips
import sys, os, random
import moviepy.config as mpy_config
mpy_config.change_settings({"IMAGEMAGICK_BINARY": r"E:\ImageMagick-7.1.2-Q16-HDRI\magick.exe"})


# Usage: python video_edit.py <videos_list> <audios_list> <segments_list> <output_path>
videos_list = sys.argv[1]
audios_list = sys.argv[2]
segments_list = sys.argv[3]
output_path = sys.argv[4]

# Read lists
with open(videos_list, 'r', encoding='utf-8') as f:
    video_paths = [line.strip() for line in f if line.strip()]
with open(audios_list, 'r', encoding='utf-8') as f:
    audio_paths = [line.strip() for line in f if line.strip()]
with open(segments_list, 'r', encoding='utf-8') as f:
    segments = [line.strip() for line in f if line.strip()]

clips = []
for i in range(len(segments)):
    vclip = VideoFileClip(video_paths[i])
    aclip = AudioFileClip(audio_paths[i])
    # Wrap text and shrink font size for long segments
    seg_text = segments[i]
    # Estimate font size based on length
    base_fontsize = 48
    font_size = max(24, base_fontsize - int(len(seg_text) / 50) * 8)
    # Wrap text every 40 chars
    import textwrap
    wrapped = '\n'.join(textwrap.wrap(seg_text, width=40))
    text_clip = TextClip(wrapped, fontsize=font_size, color='white', bg_color='black', size=vclip.size)
    text_clip = text_clip.set_duration(vclip.duration).set_position('center').set_opacity(0.6)
    comp = CompositeVideoClip([vclip, text_clip]).set_audio(aclip)
    clips.append(comp)

# Define random transitions
def random_transition(c1, c2):
    effect = random.choice(['crossfadein', 'fadein', 'fadeout', 'none'])
    if effect == 'crossfadein':
        return c1.crossfadein(1), c2.set_start(c1.duration-1).crossfadein(1)
    elif effect == 'fadein':
        return c1, c2.fadein(1)
    elif effect == 'fadeout':
        return c1.fadeout(1), c2
    else:
        return c1, c2

# Apply transitions
final_clips = []
for i in range(len(clips)):
    if i == 0:
        final_clips.append(clips[i])
    else:
        prev, curr = random_transition(final_clips[-1], clips[i])
        final_clips[-1] = prev
        final_clips.append(curr)

final = concatenate_videoclips(final_clips, method="compose")
final.write_videofile(output_path, codec='libx264', audio_codec='aac')
