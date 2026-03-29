# 🧠 MedAssist AI — Model Training Guide

Train 3 medical image classification CNN models using **Transfer Learning (MobileNetV2)** and convert them to **TensorFlow.js** for browser-based inference.

## Models

| Model | Classes | Dataset | Expected Accuracy |
|-------|---------|---------|-------------------|
| **Chest X-Ray** | Normal, Pneumonia | Kaggle Chest X-Ray Pneumonia | ~92-95% |
| **Skin Lesion** | 7 skin conditions | HAM10000 | ~80-85% |
| **Eye Disease** | Cataract, DR, Glaucoma, Normal | Eye Disease Classification | ~85-90% |

---

## Prerequisites

- **Python 3.9+** installed
- **pip** package manager
- **Kaggle account** (free) for downloading datasets
- **GPU recommended** (training on CPU is much slower, ~5-10x)

---

## Step 1: Install Dependencies

```bash
cd model_training
pip install -r requirements.txt
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
1. **Loads & augments** the dataset (rotation, flip, zoom, brightness)
2. **Builds** MobileNetV2 with a custom classification head
3. **Phase 1**: Trains only the classification head (base frozen) — ~25 epochs
4. **Phase 2**: Fine-tunes the top layers of MobileNetV2 — ~10-15 epochs
5. **Evaluates** on test set — outputs accuracy, confusion matrix, classification report
6. **Converts** to TensorFlow.js format automatically

### Training Time (approximate):
| Model | GPU (RTX 3060+) | CPU |
|-------|-----------------|-----|
| Chest X-Ray | ~15-20 min | ~2-3 hours |
| Skin Lesion | ~25-35 min | ~4-5 hours |
| Eye Disease | ~20-30 min | ~3-4 hours |

---

## Step 4: Output Files

After training, each model produces:

```
saved_models/chest_xray/
├── saved_model/          # TensorFlow SavedModel
├── tfjs_model/           # ← This is what you need!
│   ├── model.json
│   ├── group1-shard1of1.bin (or similar)
│   └── labels.json       # Class names for the web app
├── training_history.png
├── confusion_matrix.png
└── classification_report.txt
```

---

## Step 5: Integrate into Next.js App

1. **Copy the `tfjs_model/` folders** to your Next.js `public/` directory:

```bash
# From project root
mkdir -p public/models/chest_xray
mkdir -p public/models/skin_lesion
mkdir -p public/models/eye_disease

# Copy models
cp -r model_training/saved_models/chest_xray/tfjs_model/* public/models/chest_xray/
cp -r model_training/saved_models/skin_lesion/tfjs_model/* public/models/skin_lesion/
cp -r model_training/saved_models/eye_disease/tfjs_model/* public/models/eye_disease/
```

2. **Update `app/scan/page.js`** to load your custom models instead of MobileNet:

```javascript
// Replace the MobileNet loading code with:

// Map scan type to model path & labels
const MODEL_PATHS = {
  "chest-xray": "/models/chest_xray/model.json",
  "skin-lesion": "/models/skin_lesion/model.json",
  "eye-disease": "/models/eye_disease/model.json",
};

// In handleAnalyze():
const tf = await import("@tensorflow/tfjs");
await tf.ready();

// Load YOUR custom model (not MobileNet!)
const model = await tf.loadGraphModel(MODEL_PATHS[selectedType]);

// Preprocess image
const img = imageRef.current;
const tensor = tf.browser.fromPixels(img)
  .resizeNearestNeighbor([224, 224])
  .toFloat()
  .div(255.0)
  .expandDims(0);

// Run inference
const predictions = model.predict(tensor);
const probabilities = await predictions.data();

// Load labels
const labelsRes = await fetch(MODEL_PATHS[selectedType].replace("model.json", "labels.json"));
const labels = await labelsRes.json();

// Get top predictions
const results = labels.class_names.map((name, i) => ({
  label: name,
  confidence: Math.round(probabilities[i] * 100),
})).sort((a, b) => b.confidence - a.confidence);
```

---

## Architecture Details

All 3 models use the same architecture pattern:

```
MobileNetV2 (ImageNet pre-trained, partially frozen)
    ↓
GlobalAveragePooling2D
    ↓
BatchNormalization → Dropout(0.4)
    ↓
Dense(512, ReLU) → BatchNorm → Dropout(0.3)
    ↓
Dense(256, ReLU) → BatchNorm → Dropout(0.3)
    ↓
Dense(128, ReLU) → Dropout(0.2)
    ↓
Dense(num_classes, Softmax/Sigmoid)
```

### Why MobileNetV2?
- **Lightweight**: ~14MB → runs in browser via TF.js
- **Fast inference**: <100ms on modern hardware
- **Good accuracy**: Transfer learning from ImageNet gives strong feature extraction
- **Proven**: Widely used in mobile/edge medical AI applications

---

## Troubleshooting

### "CUDA out of memory"
Reduce `batch_size` in the CONFIG dict (try 16 or 8).

### "No module named tensorflow"
```bash
pip install tensorflow
```

### Training accuracy is very low
- Make sure dataset structure matches the expected format
- Check that images are valid (.jpg/.png)
- Try increasing epochs or reducing learning rate

### TF.js conversion fails
```bash
pip install tensorflowjs --upgrade
```

---

## ⚠️ Disclaimer

These models are for **educational/demonstration purposes only**.
They are NOT medical devices and should NOT be used for actual medical diagnosis.
Always consult qualified healthcare professionals.
