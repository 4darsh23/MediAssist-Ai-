"""
==============================================
  Skin Lesion Classification - CNN Model
==============================================
Dataset: HAM10000 from Kaggle
URL: https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000

Classes (7):
  - akiec: Actinic Keratoses
  - bcc:   Basal Cell Carcinoma
  - bkl:   Benign Keratosis
  - df:    Dermatofibroma
  - mel:   Melanoma
  - nv:    Melanocytic Nevi
  - vasc:  Vascular Lesions

Architecture: MobileNetV2 + Custom Head (Transfer Learning)
Output: TensorFlow SavedModel + TensorFlow.js model

Instructions:
  1. Download HAM10000 from Kaggle:
     https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000
  2. Extract to: model_training/datasets/skin_lesion/
     Expected files:
       datasets/skin_lesion/
         HAM10000_images_part_1/    (folder with .jpg images)
         HAM10000_images_part_2/    (folder with .jpg images)
         HAM10000_metadata.csv      (CSV with labels)
  3. pip install -r requirements.txt
  4. Run: python train_skin_lesion.py
"""

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from PIL import Image
import seaborn as sns
import shutil
import json

# ========================
# Configuration
# ========================
CONFIG = {
    "dataset_dir": os.path.join(os.path.dirname(__file__), "datasets", "skin_lesion"),
    "output_dir": os.path.join(os.path.dirname(__file__), "saved_models", "skin_lesion"),
    "processed_dir": os.path.join(os.path.dirname(__file__), "datasets", "skin_lesion_processed"),
    "img_size": (224, 224),
    "batch_size": 32,
    "epochs": 30,
    "learning_rate": 0.0001,
    "fine_tune_at": 100,
    "fine_tune_epochs": 15,
    "fine_tune_lr": 0.00001,
    "class_names": [
        "Actinic Keratoses",
        "Basal Cell Carcinoma",
        "Benign Keratosis",
        "Dermatofibroma",
        "Melanoma",
        "Melanocytic Nevi",
        "Vascular Lesions",
    ],
    "class_codes": ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"],
}


def prepare_dataset(dataset_dir, processed_dir, img_size):
    """
    Read HAM10000 metadata and organize images into train/val/test folders
    structured by class for ImageDataGenerator.
    """
    print("📦 Preparing dataset from HAM10000...")

    metadata_path = os.path.join(dataset_dir, "HAM10000_metadata.csv")
    if not os.path.exists(metadata_path):
        raise FileNotFoundError(
            f"Metadata file not found: {metadata_path}\n"
            "Please download HAM10000 from Kaggle and extract to the dataset directory."
        )

    df = pd.read_csv(metadata_path)
    print(f"   Total images in metadata: {len(df)}")
    print(f"   Class distribution:\n{df['dx'].value_counts()}\n")

    # Find all image directories
    image_dirs = []
    for name in os.listdir(dataset_dir):
        path = os.path.join(dataset_dir, name)
        if os.path.isdir(path) and "images" in name.lower():
            image_dirs.append(path)

    if not image_dirs:
        # Check if images are directly in dataset_dir
        if any(f.endswith(".jpg") for f in os.listdir(dataset_dir)):
            image_dirs = [dataset_dir]

    print(f"   Image directories: {image_dirs}")

    # Build image path lookup
    image_paths = {}
    for img_dir in image_dirs:
        for fname in os.listdir(img_dir):
            if fname.endswith((".jpg", ".png")):
                image_id = os.path.splitext(fname)[0]
                image_paths[image_id] = os.path.join(img_dir, fname)

    print(f"   Found {len(image_paths)} images on disk")

    # Filter metadata to only include images we have
    df = df[df["image_id"].isin(image_paths)]
    df["path"] = df["image_id"].map(image_paths)
    print(f"   Matched images: {len(df)}")

    # Split into train/val/test (70/15/15)
    # Stratify by class to maintain distribution
    train_df, temp_df = train_test_split(
        df, test_size=0.3, stratify=df["dx"], random_state=42
    )
    val_df, test_df = train_test_split(
        temp_df, test_size=0.5, stratify=temp_df["dx"], random_state=42
    )

    print(f"   Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")

    # Create directory structure
    for split, split_df in [("train", train_df), ("val", val_df), ("test", test_df)]:
        for class_code in CONFIG["class_codes"]:
            class_dir = os.path.join(processed_dir, split, class_code)
            os.makedirs(class_dir, exist_ok=True)

        for _, row in split_df.iterrows():
            src = row["path"]
            dst = os.path.join(processed_dir, split, row["dx"], f"{row['image_id']}.jpg")
            if not os.path.exists(dst):
                shutil.copy2(src, dst)

    print("   ✅ Dataset organized into train/val/test folders")
    return train_df, val_df, test_df


def create_data_generators(processed_dir, img_size, batch_size):
    """Create augmented training and validation data generators."""

    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.25,
        horizontal_flip=True,
        vertical_flip=True,
        brightness_range=[0.7, 1.3],
        fill_mode="nearest",
    )

    val_test_datagen = ImageDataGenerator(rescale=1.0 / 255)

    train_gen = train_datagen.flow_from_directory(
        os.path.join(processed_dir, "train"),
        target_size=img_size,
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=True,
    )

    val_gen = val_test_datagen.flow_from_directory(
        os.path.join(processed_dir, "val"),
        target_size=img_size,
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=False,
    )

    test_gen = val_test_datagen.flow_from_directory(
        os.path.join(processed_dir, "test"),
        target_size=img_size,
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=False,
    )

    return train_gen, val_gen, test_gen


def build_model(img_size, num_classes=7):
    """Build MobileNetV2 model for multi-class skin lesion classification."""

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
    """Unfreeze top layers for fine-tuning."""

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
    """Compute class weights to handle imbalanced dataset."""
    from sklearn.utils.class_weight import compute_class_weight

    classes = np.unique(train_gen.classes)
    weights = compute_class_weight("balanced", classes=classes, y=train_gen.classes)
    return dict(zip(classes, weights))


def plot_training_history(history, history_fine, output_dir):
    """Plot training metrics."""

    acc = history.history["accuracy"] + history_fine.history["accuracy"]
    val_acc = history.history["val_accuracy"] + history_fine.history["val_accuracy"]
    loss = history.history["loss"] + history_fine.history["loss"]
    val_loss = history.history["val_loss"] + history_fine.history["val_loss"]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    ax1.plot(acc, label="Train Accuracy")
    ax1.plot(val_acc, label="Val Accuracy")
    ax1.axvline(x=len(history.history["accuracy"]) - 1, color="r", linestyle="--", label="Fine-tuning")
    ax1.set_title("Skin Lesion Model - Accuracy")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Accuracy")
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    ax2.plot(loss, label="Train Loss")
    ax2.plot(val_loss, label="Val Loss")
    ax2.axvline(x=len(history.history["loss"]) - 1, color="r", linestyle="--", label="Fine-tuning")
    ax2.set_title("Skin Lesion Model - Loss")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Loss")
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "training_history.png"), dpi=150)
    plt.close()


def evaluate_model(model, test_gen, class_names, class_codes, output_dir):
    """Evaluate and generate confusion matrix."""

    predictions = model.predict(test_gen)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_gen.classes

    # Classification report
    report = classification_report(y_true, y_pred, target_names=class_codes)
    print("\n" + "=" * 50)
    print("CLASSIFICATION REPORT")
    print("=" * 50)
    print(report)

    with open(os.path.join(output_dir, "classification_report.txt"), "w") as f:
        f.write(report)

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=class_codes, yticklabels=class_codes)
    plt.title("Confusion Matrix - Skin Lesion Classification")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "confusion_matrix.png"), dpi=150)
    plt.close()

    test_loss, test_acc = model.evaluate(test_gen, verbose=0)
    print(f"\nTest Accuracy: {test_acc:.4f}")
    print(f"Test Loss:     {test_loss:.4f}")

    return test_acc


def convert_to_tfjs(saved_model_dir, output_dir):
    """Convert to TF.js format."""
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

        # Save labels
        labels = {
            "class_names": CONFIG["class_names"],
            "class_codes": CONFIG["class_codes"],
            "model_type": "skin_lesion",
        }
        with open(os.path.join(tfjs_dir, "labels.json"), "w") as f:
            json.dump(labels, f, indent=2)
    else:
        print(f"Conversion failed: {result.stderr}")

    return tfjs_dir


def main():
    print("=" * 60)
    print("  SKIN LESION CLASSIFICATION - MODEL TRAINING")
    print("=" * 60)

    # Check dataset
    if not os.path.exists(CONFIG["dataset_dir"]):
        print(f"\n❌ Dataset not found at: {CONFIG['dataset_dir']}")
        print(f"\nDownload HAM10000 from Kaggle:")
        print(f"  https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000")
        print(f"\nExtract to: {CONFIG['dataset_dir']}")
        return

    os.makedirs(CONFIG["output_dir"], exist_ok=True)

    # GPU setup
    gpus = tf.config.list_physical_devices("GPU")
    if gpus:
        print(f"\n✅ GPU detected: {gpus[0].name}")
        tf.config.experimental.set_memory_growth(gpus[0], True)
    else:
        print("\n⚠️  No GPU. Training will be slower.")

    # Step 1: Prepare dataset
    train_df, val_df, test_df = prepare_dataset(
        CONFIG["dataset_dir"], CONFIG["processed_dir"], CONFIG["img_size"]
    )

    # Step 2: Create generators
    print("\n📁 Creating data generators...")
    train_gen, val_gen, test_gen = create_data_generators(
        CONFIG["processed_dir"], CONFIG["img_size"], CONFIG["batch_size"]
    )
    print(f"   Train: {train_gen.samples}, Val: {val_gen.samples}, Test: {test_gen.samples}")
    print(f"   Classes: {train_gen.class_indices}")

    # Compute class weights
    class_weight = compute_class_weights(train_gen)
    print(f"   Class weights: {class_weight}")

    # Step 3: Build model
    print("\n🏗️  Building model...")
    model, base_model = build_model(CONFIG["img_size"], num_classes=7)
    model.summary()

    # Step 4: Phase 1 training
    print("\n🚀 Phase 1: Training classification head...")
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

    # Step 5: Phase 2 fine-tuning
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

    # Step 6: Evaluate
    print("\n📊 Evaluating...")
    test_acc = evaluate_model(
        model, test_gen, CONFIG["class_names"], CONFIG["class_codes"], CONFIG["output_dir"]
    )

    # Step 7: Save
    saved_model_dir = os.path.join(CONFIG["output_dir"], "saved_model")
    model.save(saved_model_dir)

    # Step 8: Plot
    plot_training_history(history, history_fine, CONFIG["output_dir"])

    # Step 9: Convert to TF.js
    tfjs_dir = convert_to_tfjs(saved_model_dir, CONFIG["output_dir"])

    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE!")
    print("=" * 60)
    print(f"  Test Accuracy: {test_acc:.4f}")
    print(f"  TF.js Model:   {tfjs_dir}")
    print(f"  Classes:        {CONFIG['class_codes']}")
    print("=" * 60)
    print(f"\n  Copy tfjs_model to: public/models/skin_lesion/")


if __name__ == "__main__":
    main()
