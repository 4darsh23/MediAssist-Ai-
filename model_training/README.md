# 🧠 MedAssist AI — Model Training Guide (PyTorch + CUDA)

Train 3 medical image classification CNN models using **PyTorch + CUDA GPU** and export to **ONNX** for browser-based inference via **ONNX Runtime Web**.

## Models

| Model | Classes | Dataset | Expected Accuracy |
|-------|---------|---------|-------------------|
| **Chest X-Ray** | Normal, Pneumonia | Kaggle Chest X-Ray Pneumonia | ~93-96% |
| **Skin Lesion** | 7 skin conditions | HAM10000 | ~82-87% |
| **Eye Disease** | Cataract, DR, Glaucoma, Normal | Eye Disease Classification | ~87-92% |

---

## Prerequisites

- **Python 3.10+** with pip
- **PyTorch 2.x with CUDA** (already installed)
- **NVIDIA GPU** with CUDA support (RTX 4050+ recommended)
- **Kaggle account** (free) to download datasets

---

## Step 1: Install Dependencies

PyTorch + CUDA should already be installed. Install the rest:

```bash
cd model_training
pip install -r requirements.txt
```

If PyTorch is not installed:
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
```

---

## Step 2: Download Datasets

### 2a. Chest X-Ray (Pneumonia)
1. Go to: https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia
2. Click **Download** → extract the ZIP
3. Place in: `model_training/datasets/chest_xray/`

```
datasets/chest_xray/
├── train/
│   ├── NORMAL/      (~1341 images)
│   └── PNEUMONIA/   (~3875 images)
├── val/
│   ├── NORMAL/
│   └── PNEUMONIA/
└── test/
    ├── NORMAL/      (~234 images)
    └── PNEUMONIA/   (~390 images)
```

### 2b. Skin Lesion (HAM10000)
1. Go to: https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000
2. Click **Download** → extract the ZIP
3. Place in: `model_training/datasets/skin_lesion/`

```
datasets/skin_lesion/
├── HAM10000_images_part_1/   (images)
├── HAM10000_images_part_2/   (images)
└── HAM10000_metadata.csv     (labels)
```

### 2c. Eye Disease
1. Go to: https://www.kaggle.com/datasets/gunavenkatdoddi/eye-diseases-classification
2. Click **Download** → extract the ZIP
3. Place in: `model_training/datasets/eye_disease/`

```
datasets/eye_disease/
├── normal/
├── cataract/
├── glaucoma/
└── diabetic_retinopathy/
```

---

## Step 3: Train Models

Run each training script from the `model_training/` directory:

```bash
# Train Chest X-Ray model
python train_chest_xray.py

# Train Skin Lesion model
python train_skin_lesion.py

# Train Eye Disease model
python train_eye_disease.py
```

### What each script does:
1. **Detects GPU** — automatically uses CUDA if RTX GPU available
2. **Loads & augments** the dataset (rotation, flip, zoom, color jitter, random erasing)
3. **Builds EfficientNet-B0** with a custom classification head
4. **Phase 1**: Trains only the classification head (backbone frozen) — ~25-30 epochs
5. **Phase 2**: Fine-tunes the top backbone blocks — ~15 epochs
6. **Evaluates** on test set — accuracy, confusion matrix, classification report
7. **Exports to ONNX** format automatically

### Training Time (approximate on RTX 4050):

| Model | GPU Time | CPU Time |
|-------|----------|----------|
| Chest X-Ray | ~10-15 min | ~2-3 hours |
| Skin Lesion | ~15-25 min | ~4-5 hours |
| Eye Disease | ~12-20 min | ~3-4 hours |

### Key Improvements over old TensorFlow scripts:
- **GPU acceleration** — native CUDA support on Windows via PyTorch
- **EfficientNet-B0** backbone (was MobileNetV2) — +3-8% accuracy
- **Mixed precision training** (AMP) — 2x faster on RTX GPUs
- **Label smoothing** — reduces overconfidence, better generalization
- **Cosine annealing LR** — smoother convergence than ReduceLROnPlateau
- **AdamW optimizer** — better weight decay than Adam
- **Better augmentation** — random erasing, color jitter, affine transforms
- **Fixed chest X-ray validation** — merged the tiny 16-image val set, split properly

---

## Step 4: Output Files

After training, each model produces:

```
saved_models/chest_xray/
├── model.pth              # PyTorch model weights
├── model.onnx             # ← ONNX model for browser
├── labels.json            # ← Class names + normalization params
├── training_history.png   # Training curves
├── confusion_matrix.png   # Test evaluation
└── classification_report.txt
```

---

## Step 5: Deploy to Next.js App

Copy model files to the Next.js `public/` directory:

```powershell
# From project root (PowerShell)
Copy-Item model_training\saved_models\chest_xray\model.onnx public\models\chest-xray\
Copy-Item model_training\saved_models\chest_xray\labels.json public\models\chest-xray\

Copy-Item model_training\saved_models\skin_lesion\model.onnx public\models\skin-lesion\
Copy-Item model_training\saved_models\skin_lesion\labels.json public\models\skin-lesion\

Copy-Item model_training\saved_models\eye_disease\model.onnx public\models\eye-disease\
Copy-Item model_training\saved_models\eye_disease\labels.json public\models\eye-disease\
```

The scan page (`app/scan/page.js`) will automatically load and use these ONNX models via ONNX Runtime Web.

---

## Architecture Details

All 3 models use EfficientNet-B0 with a custom classification head:

```
EfficientNet-B0 (ImageNet pre-trained)
    ↓
Dropout(0.4)
    ↓
Dense(1280 → 512, ReLU) → BatchNorm → Dropout(0.3)
    ↓
Dense(512 → 256, ReLU) → BatchNorm → Dropout(0.3)
    ↓
Dense(256 → 128, ReLU) → Dropout(0.2)
    ↓
Dense(128 → num_classes) → Softmax
```

### Why EfficientNet-B0?
- **Better accuracy** than MobileNetV2 (+5-8% on ImageNet)
- **Compound scaling** — optimally balances depth, width, and resolution
- **Reasonable size** — ~21 MB ONNX model, loads fast in browser
- **Proven** — widely used in medical imaging research

### Why ONNX Runtime Web?
- **Direct PyTorch → Browser** path (no TensorFlow conversion needed)
- **WebAssembly backend** — fast inference on any device
- **Maintained by Microsoft** — actively developed, good compatibility

---

## Troubleshooting

### "CUDA out of memory"
Reduce `batch_size` in the CONFIG dict (try 16 or 8).

### "No module named torch"
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
```

### Training accuracy is very low
- Verify dataset structure matches expected format
- Check images are valid (.jpg/.png)
- Try increasing epochs or reducing learning rate

### ONNX export fails
```bash
pip install onnx --upgrade
```

---

## ⚠️ Disclaimer

These models are for **educational/demonstration purposes only**.
They are NOT medical devices and should NOT be used for actual medical diagnosis.
Always consult qualified healthcare professionals.
