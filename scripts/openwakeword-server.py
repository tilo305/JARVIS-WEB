#!/usr/bin/env python3
"""
openWakeWord WebSocket server for JARVIS-WEB.
Streams 16 kHz 16-bit PCM from browser, runs openWakeWord "hey jarvis" model,
sends activations back over WebSocket. Optimized for 80 ms frames (1280 samples) for low latency.

Usage:
  pip install openwakeword aiohttp resampy numpy
  python scripts/openwakeword-server.py [--port 8765] [--chunk-size 1280]

Compatible with aUdiO dOcS.md (16 kHz, pcm_s16le) and cArTeSiA dOcS.md (STT 16 kHz).
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from typing import Any

try:
    import aiohttp
    from aiohttp import web
except ImportError:
    print("Missing aiohttp. Install: pip install aiohttp", file=sys.stderr)
    sys.exit(1)

try:
    import numpy as np
except ImportError:
    print("Missing numpy. Install: pip install numpy", file=sys.stderr)
    sys.exit(1)

try:
    from openwakeword import Model as OWWModel
except ImportError:
    print("Missing openwakeword. Install: pip install openwakeword", file=sys.stderr)
    sys.exit(1)

try:
    import resampy
except (ImportError, AttributeError):
    resampy = None  # optional; require 16 kHz from client if not installed

# --- Configuration ---
DEFAULT_PORT = 8765
DEFAULT_CHUNK_SIZE = 1280  # 80 ms @ 16 kHz (openWakeWord optimal frame size)
TARGET_SAMPLE_RATE = 16000
THRESHOLD = 0.5  # openWakeWord default; tune for fewer false positives
HEY_JARVIS_MODEL = "hey jarvis"
MAX_BUFFER_SIZE = 12800  # Max 10 frames (1280 * 10) to prevent memory issues

# --- Logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [openWakeWord] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("openwakeword-server")


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="openWakeWord WebSocket server for JARVIS-WEB (hey jarvis)"
    )
    p.add_argument(
        "--port",
        type=int,
        default=DEFAULT_PORT,
        help=f"WebSocket server port (default: {DEFAULT_PORT})",
    )
    p.add_argument(
        "--chunk-size",
        type=int,
        default=DEFAULT_CHUNK_SIZE,
        help=f"Audio chunk size in samples, 80 ms = 1280 @ 16 kHz (default: {DEFAULT_CHUNK_SIZE})",
    )
    p.add_argument(
        "--inference-framework",
        choices=("onnx", "tflite"),
        default="onnx",
        help="Inference backend (default: onnx; tflite on Linux can be faster)",
    )
    p.add_argument(
        "--threshold",
        type=float,
        default=THRESHOLD,
        help=f"Activation threshold 0..1 (default: {THRESHOLD})",
    )
    p.add_argument(
        "--verbose",
        action="store_true",
        help="Log every prediction (noisy)",
    )
    p.add_argument(
        "--enable-speex",
        action="store_true",
        help="Enable Speex noise suppression (can improve performance in noisy environments)",
    )
    return p.parse_args()


# Global model (loaded once at startup)
_oww_model: OWWModel | None = None
_args: argparse.Namespace | None = None


def _get_model() -> tuple[OWWModel, argparse.Namespace]:
    global _oww_model, _args
    if _oww_model is None or _args is None:
        raise RuntimeError("openWakeWord model not initialized")
    return _oww_model, _args


async def websocket_handler(request: web.Request) -> web.WebSocketResponse:
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    model, args = _get_model()
    chunk_size = args.chunk_size
    threshold = args.threshold
    sample_rate: int | None = None
    buffer: list[int] = []
    frame_count = 0
    activation_count = 0
    first_binary_logged = False

    try:
        # Send loaded model names so client can verify
        model_names = list(model.models.keys())
        await ws.send_str(json.dumps({"loaded_models": model_names}))
        logger.info("Client connected; sent loaded_models=%s", model_names)

        async for msg in ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                try:
                    sample_rate = int(msg.data.strip())
                except (ValueError, TypeError):
                    logger.warning("Invalid sample rate message: %s", msg.data)
                    continue
                if sample_rate <= 0 or sample_rate > 192000:
                    logger.warning("Unsupported sample rate: %s", sample_rate)
                else:
                    logger.info("Client sample rate: %s Hz", sample_rate)
                continue

            if msg.type == aiohttp.WSMsgType.ERROR:
                logger.warning("WebSocket error: %s", ws.exception())
                break

            if msg.type != aiohttp.WSMsgType.BINARY:
                continue

            # Binary: 16-bit PCM audio
            raw = msg.data
            if len(raw) % 2 == 1:
                raw += b"\x00"
            data = np.frombuffer(raw, dtype=np.int16)

            if sample_rate is None:
                logger.warning("Received audio before sample rate; assuming 16000")
                sample_rate = TARGET_SAMPLE_RATE

            if sample_rate != TARGET_SAMPLE_RATE and resampy is not None:
                data = resampy.resample(
                    data.astype(np.float64) / 32768.0,
                    sample_rate,
                    TARGET_SAMPLE_RATE,
                )
                data = (data * 32768).clip(-32768, 32767).astype(np.int16)
            elif sample_rate != TARGET_SAMPLE_RATE:
                logger.warning(
                    "Resampling skipped (install resampy); client should send 16 kHz"
                )

            for s in data.tolist():
                buffer.append(s)

            # Prevent buffer overflow (drop oldest samples if buffer grows too large)
            if len(buffer) > MAX_BUFFER_SIZE:
                original_size = len(buffer)
                dropped = original_size - MAX_BUFFER_SIZE
                buffer = buffer[-MAX_BUFFER_SIZE:]
                logger.warning("Buffer overflow: dropped %s samples (buffer was %s, max %s)", 
                             dropped, original_size, MAX_BUFFER_SIZE)

            if not first_binary_logged:
                first_binary_logged = True
                logger.info("First binary audio payload received (samples=%s)", len(data))

            while len(buffer) >= chunk_size:
                frame_int16 = np.array(buffer[:chunk_size], dtype=np.int16)
                buffer = buffer[chunk_size:]
                frame_count += 1

                # Convert int16 PCM to float32 normalized (-1.0 to 1.0) for openWakeWord
                # openWakeWord's predict() expects float32 normalized audio
                frame = frame_int16.astype(np.float32) / 32768.0
                # Clamp to [-1.0, 1.0] range to ensure proper normalization
                frame = np.clip(frame, -1.0, 1.0)

                try:
                    predictions = model.predict(frame)
                except Exception as e:
                    logger.error("Predict error: %s", e, exc_info=True)
                    continue

                activations = [
                    k for k, v in predictions.items()
                    if isinstance(v, (int, float)) and float(v) >= threshold
                ]
                if activations:
                    activation_count += 1
                    payload = json.dumps({"activations": activations})
                    await ws.send_str(payload)
                    logger.info("Activation #%s: %s (sent payload to client)", activation_count, activations)
                    # CRITICAL: Flush model state after detection to prevent false positives
                    # openWakeWord maintains internal state that can cause spurious detections
                    # if not reset after a valid activation (per openWakeWord best practices)
                    try:
                        # Try reset() first (preferred method), fallback to flush() if available
                        if hasattr(model, 'reset'):
                            model.reset()
                            logger.debug("Model state flushed after activation (reset)")
                        elif hasattr(model, 'flush'):
                            model.flush()
                            logger.debug("Model state flushed after activation (flush)")
                        else:
                            logger.warning("Model does not have reset() or flush() method - state may persist")
                    except Exception as e:
                        logger.warning("Failed to flush model state: %s", e)
                elif args.verbose and frame_count % 50 == 0:
                    logger.debug("Frame %s scores: %s", frame_count, predictions)

    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error("WebSocket handler error: %s", e, exc_info=True)
    finally:
        logger.info("Client disconnected (frames=%s, activations=%s)", frame_count, activation_count)

    return ws


def main() -> int:
    global _oww_model, _args
    args = _parse_args()
    _args = args

    logger.info("Loading openWakeWord model: %s (framework=%s)", HEY_JARVIS_MODEL, args.inference_framework)
    try:
        import openwakeword as _oww
        _oww.utils.download_models()
    except Exception as e:
        logger.warning("Pre-download models skipped: %s", e)
    try:
        # Enable Speex noise suppression if requested (per openWakeWord best practices)
        # This can reduce both false-reject and false-accept rates in noisy environments
        model_kwargs = {
            "wakeword_models": [HEY_JARVIS_MODEL],
            "inference_framework": args.inference_framework,
        }
        if args.enable_speex:
            model_kwargs["enable_speex_noise_suppression"] = True
            logger.info("Speex noise suppression enabled")
        _oww_model = OWWModel(**model_kwargs)
    except Exception as e:
        logger.error("Failed to load openWakeWord model: %s", e, exc_info=True)
        return 1
    logger.info("Model loaded: %s", list(_oww_model.models.keys()))

    app = web.Application()
    app.router.add_get("/ws", websocket_handler)
    app.router.add_get("/", lambda _: web.Response(text="openWakeWord server for JARVIS-WEB. Connect to /ws with WebSocket.\n"))

    try:
        web.run_app(app, host="0.0.0.0", port=args.port, print=None)
    except OSError as e:
        if "Address already in use" in str(e) or e.errno == 98:
            logger.error("Port %s in use. Use --port N to choose another.", args.port)
        else:
            logger.error("Server error: %s", e)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
