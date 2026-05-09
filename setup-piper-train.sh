#!/usr/bin/env bash
# Sets up piper_train in a venv at ~/piper-train-env
# Tested on Jetson Orin Nano, JetPack 6 / L4T R36, CUDA 12.6, Python 3.10
set -euo pipefail

WORK="$HOME/work"
VENV="$WORK/piper-train-env"
PIPER_DIR="$WORK/piper"

TORCH_WHL="https://nvidia.box.com/shared/static/mp164asf3sceb570wvjsrezk1p4ftj8t.whl"
TORCH_WHL_NAME="torch-2.3.0-cp310-cp310-linux_aarch64.whl"

echo "=== [1/6] System packages ==="
sudo apt-get install -y \
    python3-pip python3-venv \
    espeak-ng libespeak-ng-dev \
    libsndfile1 ffmpeg \
    build-essential

echo ""
echo "=== [2/6] Create venv at $VENV ==="
python3 -m venv "$VENV"
source "$VENV/bin/activate"
pip install --upgrade pip wheel

echo ""
echo "=== [3/6] Install Jetson PyTorch 2.3.0 (CUDA 12 / aarch64) ==="
TMPWHL="$WORK/$TORCH_WHL_NAME"
if [ ! -f "$TMPWHL" ]; then
    wget -q --show-progress -O "$TMPWHL" "$TORCH_WHL"
fi
pip install "$TMPWHL"

echo ""
echo "=== [4/6] Install pytorch-lightning 1.9.5 (last 1.x, torch-2 compatible) ==="
pip install \
    "pytorch-lightning==1.9.5" \
    "numpy>=1.19.0" \
    "librosa>=0.9.2,<1" \
    "onnxruntime>=1.11.0" \
    "cython>=0.29.0,<1"

echo ""
echo "=== [5/6] Clone piper and install piper_train ==="
if [ ! -d "$PIPER_DIR" ]; then
    git clone --depth 1 https://github.com/rhasspy/piper.git "$PIPER_DIR"
fi
# --no-deps skips the torch<2 / lightning~=1.7 constraints
pip install --no-deps -e "$PIPER_DIR/src/python"

# piper-phonemize provides the C extension for Chinese phonemization
pip install "piper-phonemize~=1.1.0"

echo ""
echo "=== [6/6] Verify ==="
python3 - <<'EOF'
import torch, pytorch_lightning, piper_train
print(f"torch            {torch.__version__}  (CUDA: {torch.cuda.is_available()})")
print(f"pytorch-lightning {pytorch_lightning.__version__}")
print(f"piper_train       OK")
EOF

echo ""
echo "Done.  Activate the venv with:"
echo "  source $VENV/bin/activate"
