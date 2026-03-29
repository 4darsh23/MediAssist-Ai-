"""
==============================================
  Eye Disease Detection - CNN Model
==============================================
Dataset: Ocular Disease Recognition (ODIR-5K) from Kaggle
URL: https://www.kaggle.com/datasets/andrewmvd/ocular-disease-recognition-odir5k

Or use the simpler version:
URL: https://www.kaggle.com/datasets/gunavenkatdoddi/eye-diseases-classification

Classes (4):
  - normal:     Normal/Healthy eye
  - cataract:   Cataract
  - glaucoma:   Glaucoma
  - diabetic_retinopathy: Diabetic Retinopathy

Architecture: MobileNetV2 + Custom Head (Transfer Learning)

Instructions:
  1. Download ONE of:
     a) "Eye Diseases Classification" (simpler, recommended):
        https://www.kaggle.com/datasets/gunavenkatdoddi/eye-diseases-classification
     b) ODIR-5K (more complex):
        https://www.kaggle.com/datasets/andrewmvd/ocular-disease-recognition-odir5k

  2. Extract to: model_training/datasets/eye_disease/
     Expected structure (option a):
       datasets/eye_disease/
         normal/
         cataract/
         glaucoma/
         diabetic_retinopathy/

  3. pip install -r requirements.txt
  4. Run: python train_eye_disease.py
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import shutil
import json

# ========================
# Configuration
# ========================
CONFIG = {
    "dataset_dir": os.path.join(os.path.dirname(__file__), "datasets", "eye_disease"),
    "output_dir": os.path.join(os.path.dirname(__file__), "saved_models", "eye_disease"),
    "processed_dir": os.path.join(os.path.dirname(__file__), "datasets", "eye_disease_processed"),
    "img_size": (224, 224),
    "batch_size": 32,
    "epochs": 30,
    "learning_rate": 0.0001,
    "fine_tune_at": 100,
    "fine_tune_epochs": 15,
    "fine_tune_lr": 0.00001,
    "class_names": [
        "Cataract",
        "Diabetic Retinopathy",
        "Glaucoma",
        "Normal",
    ],
    "class_folders": ["cataract", "diabetic_retinopathy", "glaucoma", "normal"],
}


def prepare_dataset(dataset_dir, processed_dir):
    """
    Organize dataset into train/val/test splits.
    Handles both pre-split and unsplit datasets.
    """
    print("📦 Preparing eye disease dataset...")

    # Check if dataset already has train/val/test structure
    has_splits = all(
        os.path.isdir(os.path.join(dataset_dir, split))
        for split in ["train", "val", "test"]
    )

    if has_splits:
        print("   Dataset already has train/val/test structure")
        return dataset_dir

    # Check if it has class folders directly
    class_folders_found = []
    for item in os.listdir(dataset_dir):
        item_path = os.path.join(dataset_dir, item)
        if os.path.isdir(item_path):
            class_folders_found.append(item)

    if not class_folders_found:
        raise FileNotFoundError(
            f"No class folders found in {dataset_dir}. "
            "Expected folders like: normal/, cataract/, glaucoma/, diabetic_retinopathy/"
        )

    print(f"   Found class folders: {class_folders_found}")

    # Collect all images with their labels
    image_data = []
    for class_folder in class_folders_found:
        class_path = os.path.join(dataset_dir, class_folder)
        for fname in os.listdir(class_path):
            if fname.lower().endswith((".jpg", ".jpeg", ".png", ".bmp")):
                image_data.append({
                    "path": os.path.join(class_path, fname),
                    "class": class_folder.lower().replace(" ", "_"),
                    "filename": fname,
                })

    print(f"   Total images found: {len(image_data)}")

    # Show class distribution
    classes = [d["class"] for d in image_data]
    unique, counts = np.unique(classes, return_counts=True)
    for name, count in zip(unique, counts):
        print(f"     {name}: {count}")

    # Split: 70% train, 15% val, 15% test
    labels = [d["class"] for d in image_data]
    train_data, temp_data = train_test_split(
        image_data, test_size=0.3, stratify=labels, random_state=42
    )
    temp_labels = [d["class"] for d in temp_data]
    val_data, test_data = train_test_split(
        temp_data, test_size=0.5, stratify=temp_labels, random_state=42
    )

    print(f"   Split: Train={len(train_data)}, Val={len(val_data)}, Test={len(test_data)}")

    # Copy files to processed directory
    for split, data in [("train", train_data), ("val", val_data), ("test", test_data)]:
        for item in data:
            dest_dir = os.path.join(processed_dir, split, item["class"])
            os.makedirs(dest_dir, exist_ok=True)
            dest = os.path.join(dest_dir, item["filename"])
            if not os.path.exists(dest):
                shutil.copy2(item["path"], dest)

    print("   ✅ Dataset organized")
    return processed_dir


def create_data_generators(data_dir, img_size, batch_size):
    """Create augmented data generators."""

    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=25,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.15,
        zoom_range=0.2,
        horizontal_flip=True,
        brightness_range=[0.8, 1.2],
        fill_mode="nearest",
    )

    val_test_datagen = ImageDataGenerator(rescale=1.0 / 255)

    train_gen = train_datagen.flow_from_directory(
        os.path.join(data_dir, "train"),
        target_size=img_size,
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=True,
    )

    val_gen = val_test_datagen.flow_from_directory(
        os.path.join(data_dir, "val"),
        target_size=img_size,
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=False,
    )

    test_gen = val_test_datagen.flow_from_directory(
        os.path.join(data_dir, "test"),
        target_size=img_size,
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=False,
    )

    return train_gen, val_gen, test_gen


def build_model(img_size, num_classes=4):
    """Build MobileNetV2 model for eye disease classification."""

    base_model = MobileNetV2(
        input_shape=(*img_size, 3),
        include_top=False,
        weights="imagenet",
    )

    base_model.trainable = False

    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        layers.Dense(512, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(256, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=CONFIG["learning_rate"]),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    return model, base_model


def fine_tune_model(model, base_model, fine_tune_at, learning_rate):
    """Fine-tune top layers."""

    base_model.trainable = True
    for layer in base_model.layers[:fine_tune_at]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    return model


def compute_class_weights(train_gen):
    """Compute class weights for imbalanced data."""
    from sklearn.utils.class_weight import compute_class_weight

    classes = np.unique(train_gen.classes)
    weights = compute_class_weight("balanced", classes=classes, y=train_gen.classes)
    return dict(zip(classes, weights))


def plot_training_history(history, history_fine, output_dir):
    """Plot training curves."""

    acc = history.history["accuracy"] + history_fine.history["accuracy"]
    val_acc = history.history["val_accuracy"] + history_fine.history["val_accuracy"]
    loss = history.history["loss"] + history_fine.history["loss"]
    val_loss = history.history["val_loss"] + history_fine.history["val_loss"]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    ax1.plot(acc, label="Train Accuracy")
    ax1.plot(val_acc, label="Val Accuracy")
    ax1.axvline(x=len(history.history["accuracy"]) - 1, color="r", linestyle="--", label="Fine-tuning")
    ax1.set_title("Eye Disease Model - Accuracy")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Accuracy")
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    ax2.plot(loss, label="Train Loss")
    ax2.plot(val_loss, label="Val Loss")
    ax2.axvline(x=len(history.history["loss"]) - 1, color="r", linestyle="--", label="Fine-tuning")
    ax2.set_title("Eye Disease Model - Loss")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Loss")
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "training_history.png"), dpi=150)
    plt.close()


def evaluate_model(model, test_gen, class_names, output_dir):
    """Evaluate model and save results."""

    predictions = model.predict(test_gen)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_gen.classes

    # Get the actual class names from the generator (alphabetical order)
    idx_to_class = {v: k for k, v in test_gen.class_indices.items()}
    display_names = [idx_to_class[i] for i in range(len(idx_to_class))]

    report = classification_report(y_true, y_pred, target_names=display_names)
    print("\n" + "=" * 50)
    print("CLASSIFICATION REPORT")
    print("=" * 50)
    print(report)

    with open(os.path.join(output_dir, "classification_report.txt"), "w") as f:
        f.write(report)

    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=display_names, yticklabels=display_names)
    plt.title("Confusion Matrix - Eye Disease Detection")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "confusion_matrix.png"), dpi=150)
    plt.close()

    test_loss, test_acc = model.evaluate(test_gen, verbose=0)
    print(f"\nTest Accuracy: {test_acc:.4f}")
    print(f"Test Loss:     {test_loss:.4f}")

    return test_acc, display_names


def convert_to_tfjs(saved_model_dir, output_dir, display_names):
    """Convert to TF.js."""
    import subprocess

    tfjs_dir = os.path.join(output_dir, "tfjs_model")
    os.makedirs(tfjs_dir, exist_ok=True)

    cmd = [
        "tensorflowjs_converter",
        "--input_format=tf_saved_model",
        "--output_format=tfjs_graph_model",
        "--signature_name=serving_default",
        "--saved_model_tags=serve",
        saved_model_dir,
        tfjs_dir,
    ]

    print(f"\nConverting to TensorFlow.js...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        print(f"TF.js model saved to: {tfjs_dir}")

        # Map folder names to display names
        display_map = {
            "cataract": "Cataract",
            "diabetic_retinopathy": "Diabetic Retinopathy",
            "glaucoma": "Glaucoma",
            "normal": "Normal",
        }

        labels = {
            "class_names": [display_map.get(n, n) for n in display_names],
            "class_codes": display_names,
            "model_type": "eye_disease",
        }
        with open(os.path.join(tfjs_dir, "labels.json"), "w") as f:
            json.dump(labels, f, indent=2)
    else:
        print(f"Conversion failed: {result.stderr}")

    return tfjs_dir


def main():
    print("=" * 60)
    print("  EYE DISEASE DETECTION - MODEL TRAINING")
    print("=" * 60)

    if not os.path.exists(CONFIG["dataset_dir"]):
        print(f"\n❌ Dataset not found at: {CONFIG['dataset_dir']}")
        print(f"\nDownload from Kaggle (choose one):")
        print(f"  1. https://www.kaggle.com/datasets/gunavenkatdoddi/eye-diseases-classification")
        print(f"  2. https://www.kaggle.com/datasets/andrewmvd/ocular-disease-recognition-odir5k")
        print(f"\nExtract to: {CONFIG['dataset_dir']}")
        print(f"\nExpected structure:")
        print(f"  {CONFIG['dataset_dir']}/normal/")
        print(f"  {CONFIG['dataset_dir']}/cataract/")
        print(f"  {CONFIG['dataset_dir']}/glaucoma/")
        print(f"  {CONFIG['dataset_dir']}/diabetic_retinopathy/")
        return

    os.makedirs(CONFIG["output_dir"], exist_ok=True)

    # GPU
    gpus = tf.config.list_physical_devices("GPU")
    if gpus:
        print(f"\n✅ GPU: {gpus[0].name}")
        tf.config.experimental.set_memory_growth(gpus[0], True)
    else:
        print("\n⚠️  No GPU. Training will be slower.")

    # Prepare dataset
    data_dir = prepare_dataset(CONFIG["dataset_dir"], CONFIG["processed_dir"])

    # Data generators
    print("\n📁 Creating data generators...")
    train_gen, val_gen, test_gen = create_data_generators(
        data_dir, CONFIG["img_size"], CONFIG["batch_size"]
    )
    print(f"   Train: {train_gen.samples}, Val: {val_gen.samples}, Test: {test_gen.samples}")
    print(f"   Classes: {train_gen.class_indices}")

    num_classes = len(train_gen.class_indices)
    class_weight = compute_class_weights(train_gen)
    print(f"   Class weights: {class_weight}")

    # Build
    print("\n🏗️  Building model...")
    model, base_model = build_model(CONFIG["img_size"], num_classes=num_classes)
    model.summary()

    # Phase 1
    print("\n🚀 Phase 1: Training head...")
    training_callbacks = [
        callbacks.EarlyStopping(monitor="val_accuracy", patience=7, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-7),
        callbacks.ModelCheckpoint(
            os.path.join(CONFIG["output_dir"], "best_phase1.keras"),
            monitor="val_accuracy", save_best_only=True
        ),
    ]

    history = model.fit(
        train_gen, validation_data=val_gen,
        epochs=CONFIG["epochs"], class_weight=class_weight,
        callbacks=training_callbacks,
    )

    # Phase 2
    print(f"\n🔧 Phase 2: Fine-tuning...")
    model = fine_tune_model(model, base_model, CONFIG["fine_tune_at"], CONFIG["fine_tune_lr"])

    fine_tune_callbacks = [
        callbacks.EarlyStopping(monitor="val_accuracy", patience=5, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-8),
        callbacks.ModelCheckpoint(
            os.path.join(CONFIG["output_dir"], "best_final.keras"),
            monitor="val_accuracy", save_best_only=True
        ),
    ]

    history_fine = model.fit(
        train_gen, validation_data=val_gen,
        epochs=CONFIG["fine_tune_epochs"], class_weight=class_weight,
        callbacks=fine_tune_callbacks,
    )

    # Evaluate
    print("\n📊 Evaluating...")
    test_acc, display_names = evaluate_model(
        model, test_gen, CONFIG["class_names"], CONFIG["output_dir"]
    )

    # Save
    saved_model_dir = os.path.join(CONFIG["output_dir"], "saved_model")
    model.save(saved_model_dir)

    # Plot
    plot_training_history(history, history_fine, CONFIG["output_dir"])

    # Convert
    tfjs_dir = convert_to_tfjs(saved_model_dir, CONFIG["output_dir"], display_names)

    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE!")
    print("=" * 60)
    print(f"  Test Accuracy: {test_acc:.4f}")
    print(f"  TF.js Model:   {tfjs_dir}")
    print(f"  Classes:        {display_names}")
    print("=" * 60)
    print(f"\n  Copy tfjs_model to: public/models/eye_disease/")


if __name__ == "__main__":
    main()
