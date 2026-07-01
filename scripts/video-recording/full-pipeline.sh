#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────
# Full automated video pipeline for AI Mortgage Adviser marketing
#
# What it does (fully automatic):
#   1. Records screen demos with Playwright (browser automation)
#   2. Generates AI voiceover with ElevenLabs API (or macOS say)
#   3. Combines video + audio with ffmpeg
#   4. Outputs final MP4s in 3 formats (16:9, 9:16, 1:1)
#
# Requirements:
#   - Node.js + Playwright (npm install playwright)
#   - ffmpeg (brew install ffmpeg)
#   - Optional: ELEVENLABS_API_KEY for AI voice (fallback: macOS 'say')
#
# Usage:
#   ./scripts/video-recording/full-pipeline.sh
#   ELEVENLABS_API_KEY=xxx ./scripts/video-recording/full-pipeline.sh
# ─────────────────────────────────────────────────────────────────────────

set -e
cd "$(dirname "$0")/../.."

OUTPUT_DIR="docs/marketing/video/output"
RECORDINGS_DIR="docs/marketing/video/recordings"
VOICEOVER_DIR="docs/marketing/video/voiceovers"

mkdir -p "$OUTPUT_DIR" "$RECORDINGS_DIR" "$VOICEOVER_DIR"

echo "🎬 AI Mortgage Adviser — Full Video Pipeline"
echo "============================================="

# ─── Step 1: Screen Recording ──────────────────────────────────────────

echo ""
echo "📹 Step 1: Recording screen demos..."
node scripts/video-recording/record-demo.js "$@"

# ─── Step 2: Generate Voiceovers ───────────────────────────────────────

echo ""
echo "🎙️  Step 2: Generating voiceovers..."

# Voiceover scripts
HERO_VO="Confused by mortgage jargon? Paying hundreds for basic advice? Meet AI Mortgage Adviser. Upload your documents, payslips, bank statements, and get personalised mortgage advice in seconds. Instant answers, twenty-four seven. Just fifteen pounds per consultation. No broker fees, no hidden costs. Join thousands of UK homebuyers getting smarter mortgage advice. Try AI Mortgage Adviser today."

DASHBOARD_VO="Once you sign in, your personal dashboard shows everything at a glance. Your financial summary extracted from uploaded documents. Your mortgage readiness score. Borrowing estimates. Lender predictions. And a countdown to your dream home. All updated in real time as you add more documents."

CHAT_VO="Ask any mortgage question and get an instant, personalised answer. How much can I borrow? What lenders suit me best? Should I fix or go variable? Our AI analyses your actual documents to give you specific, accurate advice. Not generic calculators. Real answers for your situation."

CALCULATOR_VO="The mortgage calculator lets you explore different scenarios. Adjust the property value, deposit, and term to see monthly payments, total interest, stamp duty, and loan to value ratio. Compare fixed versus variable rates. See exactly what you can afford."

TIKTOK_VO="Upload your payslip. Get instant mortgage advice. Fifteen pounds. No broker needed."

COMPARISON_VO="Mortgage broker? Two weeks waiting. A thousand pounds in fees. Twenty lenders checked. AI Mortgage Adviser? Answers in seconds. Just fifteen pounds. Ninety plus lenders compared. Twenty-four seven availability. The choice is clear."

generate_voiceover() {
  local text="$1"
  local filename="$2"
  local output_path="$VOICEOVER_DIR/$filename"

  if [ -n "$ELEVENLABS_API_KEY" ]; then
    echo "   Using ElevenLabs API for: $filename"
    curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \
      -H "xi-api-key: $ELEVENLABS_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"text\": \"$text\",
        \"model_id\": \"eleven_monolingual_v1\",
        \"voice_settings\": {
          \"stability\": 0.5,
          \"similarity_boost\": 0.75
        }
      }" \
      -o "$output_path"
  elif command -v say &> /dev/null; then
    echo "   Using macOS 'say' for: $filename (set ELEVENLABS_API_KEY for better quality)"
    say -v Daniel -r 160 -o "${output_path%.mp3}.aiff" "$text"
    if command -v ffmpeg &> /dev/null; then
      ffmpeg -y -i "${output_path%.mp3}.aiff" -acodec libmp3lame -q:a 2 "$output_path" 2>/dev/null
      rm -f "${output_path%.mp3}.aiff"
    else
      mv "${output_path%.mp3}.aiff" "$output_path"
    fi
  else
    echo "   ⚠️  No TTS available. Set ELEVENLABS_API_KEY or install macOS."
    return 1
  fi
  echo "   ✅ $filename"
}

generate_voiceover "$HERO_VO" "hero-voiceover.mp3"
generate_voiceover "$DASHBOARD_VO" "dashboard-voiceover.mp3"
generate_voiceover "$CHAT_VO" "chat-voiceover.mp3"
generate_voiceover "$CALCULATOR_VO" "calculator-voiceover.mp3"
generate_voiceover "$TIKTOK_VO" "tiktok-voiceover.mp3"
generate_voiceover "$COMPARISON_VO" "comparison-voiceover.mp3"

# ─── Step 3: Combine Video + Audio ─────────────────────────────────────

echo ""
echo "🎬 Step 3: Combining video + audio..."

if ! command -v ffmpeg &> /dev/null; then
  echo "   ⚠️  ffmpeg not installed. Install with: brew install ffmpeg"
  echo "   Skipping video composition. Raw recordings available in: $RECORDINGS_DIR"
  exit 0
fi

compose_video() {
  local video="$1"
  local audio="$2"
  local output="$3"
  local width="$4"
  local height="$5"

  if [ ! -f "$video" ] || [ ! -f "$audio" ]; then
    echo "   ⚠️  Missing files for: $output"
    return 0
  fi

  echo "   Composing: $output (${width}x${height})"
  ffmpeg -y \
    -i "$video" \
    -i "$audio" \
    -c:v libx264 -preset medium -crf 23 \
    -c:a aac -b:a 128k \
    -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black" \
    -shortest \
    -movflags +faststart \
    "$OUTPUT_DIR/$output" 2>/dev/null

  echo "   ✅ $output"
}

# Landing page — 16:9
compose_video "$RECORDINGS_DIR/landing-scroll.webm" "$VOICEOVER_DIR/hero-voiceover.mp3" "landing-16x9.mp4" 1280 720

# Dashboard overview — 16:9
compose_video "$RECORDINGS_DIR/dashboard.webm" "$VOICEOVER_DIR/dashboard-voiceover.mp3" "dashboard-16x9.mp4" 1280 720

# AI Chat — 16:9
compose_video "$RECORDINGS_DIR/chat.webm" "$VOICEOVER_DIR/chat-voiceover.mp3" "chat-16x9.mp4" 1280 720

# Calculator — 16:9
compose_video "$RECORDINGS_DIR/calculator.webm" "$VOICEOVER_DIR/calculator-voiceover.mp3" "calculator-16x9.mp4" 1280 720

# Lender Predictions — 16:9
compose_video "$RECORDINGS_DIR/predictions.webm" "$VOICEOVER_DIR/comparison-voiceover.mp3" "predictions-16x9.mp4" 1280 720

# Documents — 16:9
compose_video "$RECORDINGS_DIR/documents.webm" "$VOICEOVER_DIR/dashboard-voiceover.mp3" "documents-16x9.mp4" 1280 720

# Mobile dashboard — 9:16 (TikTok/Reels)
compose_video "$RECORDINGS_DIR/mobile-dashboard.webm" "$VOICEOVER_DIR/tiktok-voiceover.mp3" "mobile-dashboard-9x16.mp4" 720 1280

# Dashboard — 1:1 (Facebook/LinkedIn)
compose_video "$RECORDINGS_DIR/dashboard.webm" "$VOICEOVER_DIR/dashboard-voiceover.mp3" "dashboard-1x1.mp4" 720 720

# ─── Done ──────────────────────────────────────────────────────────────

echo ""
echo "🎬 Pipeline complete!"
echo ""
echo "Output files:"
ls -lh "$OUTPUT_DIR"/*.mp4 2>/dev/null || echo "   No MP4 files (check errors above)"
echo ""
echo "Total cost: £0 (Playwright + macOS say + ffmpeg)"
echo "For better voiceover: set ELEVENLABS_API_KEY (£0.18 per 1,000 chars ≈ £0.15 per video)"
